import * as t from "babel-types";
import { NodePath, Visitor, Scope } from "babel-traverse";
import { ModuleFunctionsRegistry } from "../module-functions-registry";
import { PARALLEL_ES_MODULE_NAME } from "../constants";
import { warn, createFunctionId, createSerializedFunctionCall } from "../util";
import { transpileParallelFunctor } from "./transpile-parallel-functor";
import { ParallelMethod, isParallelFunctionCall, isParallelFunctor, PARALLEL_METHODS } from "./parallel-methods";

function isParallelObject(path: NodePath<any>): boolean {
  const parallel = path.getData("parallel:instance");

  if (parallel) {
    return true;
  }

  if (t.isIdentifier(path.node)) {
    const binding = path.scope.getBinding(path.node.name);

    if (binding) {
      return !!binding.path.getData("parallel:instance");
    }
  } else if (t.isCallExpression(path.node)) {
    return isParallelObject(path.get("callee"));
  } else if (t.isMemberExpression(path.node)) {
    return isParallelObject(path.get("object"));
  }

  return false;
}

function getParallelMethodName(path: NodePath<t.MemberExpression>): string | undefined | never {
  path.assertMemberExpression();

  if (!isParallelObject(path)) {
    return undefined;
  }

  if (t.isIdentifier(path.node.property)) {
    return path.node.property.name;
  }

  throw path.buildCodeFrameError("don't know how to determine the parallel method name from the given node", Error);
}

function hasProperty(object: NodePath<t.ObjectExpression>, propertyName: string): boolean {
  for (let i = 0; i < object.node.properties.length; ++i) {
    const property = object.get(`properties.${i}`);
    const key = property.toComputedKey();

    if (key && t.isStringLiteral(key) && key.value === propertyName) {
      return true;
    }
  }

  return false;
}

function getParallelMethod(path: NodePath<t.CallExpression>) {
  if (!t.isMemberExpression(path.node.callee)) {
    return undefined;
  }

  const methodName = getParallelMethodName(path.get("callee") as NodePath<t.MemberExpression>);

  if (!methodName || !PARALLEL_METHODS.hasOwnProperty(methodName)) {
    return undefined;
  }

  path.debug(() => `Found invocation of parallel method ${methodName}`);

  return PARALLEL_METHODS[methodName];
}

function createEnvironmentExtractor(variableNames: string[], functor: NodePath<t.Function>) {
  const properties: t.ObjectProperty[] = [];

  for (const variableName of variableNames) {
    properties.push(t.objectProperty(t.identifier(variableName), t.identifier(variableName)));
  }

  const identifier = functor.scope.generateUidIdentifier("environmentExtractor");
  const environment = t.functionDeclaration(
    identifier,
    [],
    t.blockStatement([t.returnStatement(t.objectExpression(properties))])
  );

  functor.getStatementParent().insertBefore(environment);

  return identifier;
}

function addInEnvironmentCall(call: NodePath<t.CallExpression>, environmentProvider: t.Identifier) {
  const oldCallee = call.node.callee as t.MemberExpression;
  const inEnvironment = t.memberExpression(oldCallee.object, t.identifier("inEnvironment"));
  const createEnvironmentCall = t.callExpression(environmentProvider, []);

  call
    .get("callee")
    .replaceWith(t.memberExpression(t.callExpression(inEnvironment, [createEnvironmentCall]), oldCallee.property));
}

function createEntryFunctionEnvironmentInitializerWrapper(
  entryFunction: t.FunctionDeclaration,
  environmentVariables: string[],
  scope: Scope
): t.FunctionDeclaration {
  const environmentName = scope.generateUidIdentifier("environment");
  const tryBody: t.Statement[] = [];
  const finallyBody: t.Statement[] = [];

  tryBody.push(
    t.variableDeclaration("const", [
      t.variableDeclarator(
        environmentName,
        t.memberExpression(
          t.identifier("arguments"),
          t.binaryExpression(
            "-",
            t.memberExpression(t.identifier("arguments"), t.identifier("length")),
            t.numericLiteral(1)
          ),
          true
        )
      )
    ])
  );

  for (const variable of environmentVariables) {
    tryBody.push(
      t.expressionStatement(
        t.assignmentExpression("=", t.identifier(variable), t.memberExpression(environmentName, t.identifier(variable)))
      )
    );

    finallyBody.push(
      t.expressionStatement(t.assignmentExpression("=", t.identifier(variable), t.identifier("undefined")))
    );
  }

  tryBody.push(
    t.returnStatement(
      t.callExpression(t.memberExpression(entryFunction.id, t.identifier("apply")), [
        t.thisExpression(),
        t.identifier("arguments")
      ])
    )
  );

  const body = t.blockStatement([t.tryStatement(t.blockStatement(tryBody), undefined, t.blockStatement(finallyBody))]);

  return t.functionDeclaration(scope.generateUidIdentifier("entry" + entryFunction.id.name), [], body);
}

function rewriteParallelCall(
  call: NodePath<t.CallExpression>,
  method: ParallelMethod,
  moduleFunctionRegistry: ModuleFunctionsRegistry,
  functor: NodePath<t.Function>
): t.FunctionDeclaration {
  const result = transpileParallelFunctor(
    functor as NodePath<t.Function>,
    moduleFunctionRegistry,
    isParallelFunctor(method)
  );

  if (result.environmentVariables.length === 0) {
    return result.transpiledFunctor;
  }

  const environmentProvider = createEnvironmentExtractor(result.environmentVariables, functor as NodePath<t.Function>);
  addInEnvironmentCall(call, environmentProvider);

  moduleFunctionRegistry.addEnvironmentVariables(result.environmentVariables);
  moduleFunctionRegistry.registerFunction(result.transpiledFunctor);
  return createEntryFunctionEnvironmentInitializerWrapper(
    result.transpiledFunctor,
    result.environmentVariables,
    functor.scope
  );
}

/**
 * Resolves the function declaration referenced by the given path. If the path itself is a function expression, declaration or
 * arrow function expression, then the path itself is returned. If the path is an identifier, then it is tried to resolve the binding.
 * @param functionPath the path that should reference a function
 * @param allowNonFunctions indicator if the method should fail if a non function argument has been identified
 * @returns path referencing a function, an object expression if it is a serialized function id or undefined if the function failed to resolve the
 * reference
 * @throws if the path is neither a serialized function id, reference nor function and {@code allowNonFunctions} is not true
 */
function resolveFunction(
  functionPath: NodePath<t.Node>,
  allowNonFunctions: boolean = false
): NodePath<t.Node> | undefined {
  const resolved = functionPath.resolve(true);

  if (t.isFunction(resolved.node)) {
    return resolved as NodePath<t.Function>;
  }

  // serialized function id
  if (
    t.isObjectExpression(resolved.node) &&
    hasProperty(resolved as NodePath<t.ObjectExpression>, "_______isFunctionId")
  ) {
    return resolved as NodePath<t.ObjectExpression>;
  }

  if (t.isIdentifier(resolved.node)) {
    warn(
      functionPath,
      `The function identified by the given node could not be identified. Static code rewriting of the function is therefore not possible, dynamic function dispatching is used instead.`
    );
    return undefined;
  }

  if (t.isMemberExpression(resolved.node)) {
    warn(
      functionPath,
      `Member expressions are not fully supported by the code rewriter. The given member could not be resolved and therefore the function cannot be statically rewritten.`
    );
    return undefined;
  }

  if (!allowNonFunctions) {
    throw functionPath.buildCodeFrameError(
      "The node passed as functor is neither a serialized function nor a reference to a function. Invalid use of the api."
    );
  }

  return undefined;
}

function extractFunctor(
  call: NodePath<t.CallExpression>,
  method: ParallelMethod,
  moduleFunctionRegistry: ModuleFunctionsRegistry
) {
  const functorArgument = call.get(`arguments.${method.functorArgumentIndex}`) as NodePath<
    t.Expression | t.SpreadElement
  >;
  const functor = resolveFunction(functorArgument, method.allowNonFunctions);
  if (!functor || !functor.isFunction()) {
    return;
  }

  const transpiledFunctor = rewriteParallelCall(call, method, moduleFunctionRegistry, functor as NodePath<t.Function>);
  const functorIdentifier = moduleFunctionRegistry.registerEntryFunction(transpiledFunctor);
  const functionId = createFunctionId(functorIdentifier.functionId);

  if (isParallelFunctionCall(method)) {
    const parameters = ((call.get("arguments") as any) as NodePath<t.Expression | t.SpreadElement>[]).slice(
      method.functorArgumentIndex + 1
    );
    const functionCall = createSerializedFunctionCall(functionId, parameters.map(parameter => parameter.node));
    parameters.forEach(parameter => parameter.remove());
    functorArgument.replaceWith(functionCall);
  } else {
    if (method === PARALLEL_METHODS["reduce"] && call.node.arguments.length < 3) {
      call.node.arguments.push(functorArgument.node);
    }

    functorArgument.replaceWith(functionId);
  }
}

export const StatefulParallelFunctorsExtractorVisitor: Visitor = {
  /**
   * Extracts the parallel identifier for an import default node
   */
  ImportDefaultSpecifier(path: NodePath<t.ImportDefaultSpecifier>) {
    const importStatement = path.parent as t.ImportDeclaration;

    if (importStatement.source.value === PARALLEL_ES_MODULE_NAME) {
      path.setData("parallel:instance", true);
    }
  },

  /**
   * Extracts the parallel identifier for a named default import
   */
  ImportSpecifier(path: NodePath<t.ImportSpecifier>) {
    const importStatement = path.parent as t.ImportDeclaration;

    if (importStatement.source.value === PARALLEL_ES_MODULE_NAME && path.node.imported.name === "default") {
      path.setData("parallel:instance", true);
    }
  },

  VariableDeclarator(path: NodePath<t.VariableDeclarator>) {
    // Is it a require call?
    if (
      t.isCallExpression(path.node.init) &&
      t.isIdentifier(path.node.init.callee) &&
      path.node.init.arguments.length === 1
    ) {
      const callee = path.node.init.callee;
      const functionCall: t.CallExpression = path.node.init;
      const firstArgument = t.isStringLiteral(functionCall.arguments[0])
        ? (functionCall.arguments[0] as t.StringLiteral)
        : undefined;
      if (callee.name === "require" && firstArgument && firstArgument.value === PARALLEL_ES_MODULE_NAME) {
        path.setData("parallel:instance", true);
      }
    }
  },

  CallExpression(path: NodePath<t.CallExpression>, moduleFunctionRegistry: ModuleFunctionsRegistry) {
    const method = getParallelMethod(path);

    if (
      method &&
      (isParallelFunctor(method) || isParallelFunctionCall(method)) &&
      path.node.arguments.length > method.functorArgumentIndex
    ) {
      extractFunctor(path, method, moduleFunctionRegistry);
    }
  }
};
