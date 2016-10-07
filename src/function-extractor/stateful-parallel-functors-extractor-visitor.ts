import * as t from "babel-types";
import {NodePath, Visitor} from "babel-traverse";
import {ModuleFunctionsRegistry} from "./module-functions-registry";
import {PARALLEL_ES_MODULE_NAME} from "../constants";
import {warn, createFunctionId, createSerializedFunctionCall} from "../util";
import {transpileFunctor} from "./transpile-functor";

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

/**
 * Resolves the function declaration referenced by the given path. If the path itself is a function expression, declaration or
 * arrow function expression, then the path itself is returned. If the path is an identifier, then it is tried to resolve the binding.
 * @param functionPath the path that should reference a function
 * @param allowNonFunctions indicator if the method should fail if a non function argument has been identified
 * @returns path referencing a function, an object expression if it is a serialized function id or undefined if the function failed to resolve the
 * reference
 * @throws if the path is neither a serialized function id, reference nor function and {@code allowNonFunctions} is not true
 */
function resolveFunction(functionPath: NodePath<t.Node>, allowNonFunctions: boolean = false): NodePath<t.Node> | undefined {
    const resolved = functionPath.resolve(false);

    if (t.isFunction(resolved.node)) {
        return resolved as NodePath<t.Function>;
    }

    // serialized function id
    if (t.isObjectExpression(resolved.node)  && hasProperty(resolved as NodePath<t.ObjectExpression>, "_______isFunctionId")) {
        return resolved as NodePath<t.ObjectExpression>;
    }

    if (t.isIdentifier(resolved.node)) {
        warn(functionPath, `The function identified by the given node could not be identified. Static code rewriting of the function is therefore not possible, dynamic function dispatching is used instead.`);
        return undefined;
    }

    if (!allowNonFunctions) {
        throw functionPath.buildCodeFrameError("The node passed as functor is neither a serialized function nor a reference to a function. Invalid use of the api.");
    }

    return undefined;
}

const METHODS: { [name: string]: { functorIndex: number, allowNonFunctions?: boolean, functionCall?: boolean }} = {
    filter: { functorIndex: 0 },
    inEnvironment: { allowNonFunctions: true, functionCall: true, functorIndex: 0 },
    map: { functorIndex: 0 },
    reduce: { functorIndex: 1 },
    schedule: { allowNonFunctions: true, functionCall: true, functorIndex: 0},
    times: { allowNonFunctions: true, functorIndex: 1 }
};

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
        if (t.isCallExpression(path.node.init) && t.isIdentifier(path.node.init.callee) && path.node.init.arguments.length === 1) {
            const callee = path.node.init.callee;
            const functionCall: t.CallExpression = path.node.init;
            const firstArgument = t.isStringLiteral(functionCall.arguments[0]) ? functionCall.arguments[0] as t.StringLiteral : undefined;
            if (callee.name === "require" && firstArgument && firstArgument.value === PARALLEL_ES_MODULE_NAME) {
                path.setData("parallel:instance", true);
            }
        }
    },

    CallExpression(path: NodePath<t.CallExpression>, moduleFunctionRegistry: ModuleFunctionsRegistry) {
        if (!t.isMemberExpression(path.node.callee)) {
            return;
        }

        const methodName = getParallelMethodName(path.get("callee") as NodePath<t.MemberExpression>);

        if (!methodName || !METHODS.hasOwnProperty(methodName)) {
            return;
        }

        path.debug(() => `Found invocation of parallel method ${methodName}`);

        const method = METHODS[methodName];
        if (path.node.arguments.length > method.functorIndex) {
            const functor = path.get(`arguments.${method.functorIndex}`) as NodePath<t.Expression | t.SpreadElement>;
            let functorDeclaration = resolveFunction(functor, method.allowNonFunctions);
            if (functorDeclaration && functorDeclaration.isFunction()) {
                transpileFunctor(functorDeclaration as NodePath<t.Function>, moduleFunctionRegistry);

                const registration = moduleFunctionRegistry.registerFunction(functorDeclaration! as NodePath<t.Function>);
                const functionId = createFunctionId(registration);

                if (method.functionCall) {
                    const parameters = ((path.get("arguments") as any) as NodePath<t.Expression | t.SpreadElement>[]).slice(method.functorIndex + 1);
                    const functionCall = createSerializedFunctionCall(functionId, parameters.map(parameter => parameter.node));
                    parameters.forEach(parameter => parameter.remove());
                    functor.replaceWith(functionCall);
                } else {
                    if (methodName === "reduce" && path.node.arguments.length < 3) {
                        path.node.arguments.push(functor.node);
                    }

                    functor.replaceWith(functionId);
                }
            }
        }
    }
};
