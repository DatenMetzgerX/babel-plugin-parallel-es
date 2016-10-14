import {NodePath, Binding} from "babel-traverse";
import * as t from "babel-types";
import template = require("babel-template");
import {ModuleFunctionsRegistry} from "./module-functions-registry";
import {isParallelFunctor} from "./parallel-methods";
import {IParallelChainCall} from "./parallel-chain-call";

interface IRewriterVisitorState {
    call: IParallelChainCall;
    module: ModuleFunctionsRegistry;
    accessedVariables: Set<string>;
    environment?: t.Identifier;
}

function registerImport(binding: Binding, moduleFunctionsRegistry: ModuleFunctionsRegistry, functor: NodePath<t.Function>) {
    binding.path.parentPath.assertImportDeclaration();

    const importNode = binding.path.node as t.ImportDefaultSpecifier | t.ImportNamespaceSpecifier | t.ImportSpecifier;
    const importDeclaration = binding.path.parent as t.ImportDeclaration;
    const source = binding.path.hub.file.resolveModuleSource(importDeclaration.source.value) as string;

    if (t.isImportDefaultSpecifier(importNode)) {
        moduleFunctionsRegistry.imports.addDefaultImport(source, importNode.local.name, functor);
    } else if (t.isImportNamespaceSpecifier(importNode)) {
        moduleFunctionsRegistry.imports.addNamespaceImport(source, importNode.local.name, functor);
    } else if (t.isImportSpecifier(importNode)) {
        moduleFunctionsRegistry.imports.addImport(source, importNode.imported.name, importNode.local.name, functor);
    } else {
        throw binding.path.buildCodeFrameError("Unknown import declaration");
    }
}

function resolveInFunctorScope(name: string, start: NodePath<t.Node>, functor: NodePath<t.Function>): Binding | undefined {
    /* tslint:disable:no-conditional-assignment */
    let scope = start.scope;
    let binding: Binding | undefined = undefined;
    do {
        binding = scope.getOwnBinding(name);
    } while (!binding && ((scope = scope.parent) !== functor.scope.parent));

    return binding;
}

function createEnvironmentExtractor(variableNames: Set<string>, functor: NodePath<t.Function>) {
    const properties: t.ObjectProperty[] = [];

    for (const variableName of Array.from(variableNames.values())) {
        properties.push(t.objectProperty(t.identifier(variableName), t.identifier(variableName)));
    }

    const identifier = functor.scope.generateUidIdentifier("environmentExtractor");
    const environment = t.functionDeclaration(identifier, [], t.blockStatement([
        t.returnStatement(t.objectExpression(properties))
    ]));

    functor.getStatementParent().insertBefore(environment);

    return identifier;
}

function addInEnvironmentCall(call: NodePath<t.CallExpression>, environmentProvider: t.Identifier) {
    const oldCallee = call.node.callee as t.MemberExpression;
    const inEnvironment = t.memberExpression(oldCallee.object, t.identifier("inEnvironment"));
    const createEnvironmentCall = t.callExpression(environmentProvider, []);

    call.get("callee").replaceWith(t.memberExpression(t.callExpression(inEnvironment, [createEnvironmentCall]), oldCallee.property));
}

const RewriterVisitor = {
    ThisExpression(path: NodePath<t.ThisExpression>) {
        throw path.buildCodeFrameError("This cannot be accessed inside of a function passed to a parallel method, this is always undefined.");
    },

    ReferencedIdentifier(path: NodePath<t.Identifier>, state: IRewriterVisitorState) {
        const { functor } = state.call;
        const localBinding = resolveInFunctorScope(path.node.name, path, functor);

        if (localBinding) {
            return;
        }

        // it is a binding that is defined outside of the functor, therefore the rewriter must make it available somehow...
        // if there is no rule that can make it available, bark!
        const binding = path.scope.getBinding(path.node.name);

        if (!binding) {
            return; // Globally defined objects like Math
        } else if ((binding.kind as string) === "module") {
            registerImport(binding, state.module, functor);
        } else if (binding.constant) {
            if (state.environment) {
                path.replaceWith(t.memberExpression(state.environment, path.node));
                state.accessedVariables.add(binding.identifier.name);
            } else {
                throw path.buildCodeFrameError("Access to variables from outside of the function scope are not permitted in parallel methods not accepting an environment.");
            }
        } else {
            throw path.buildCodeFrameError("Only constant variables (const, var and let variables with a single assignment) can be accessed inside of a parallel function.");
        }
    }
};

export function transpileParallelChainCall(call: IParallelChainCall, moduleFunctionRegistry: ModuleFunctionsRegistry): void {
    const {functor, method} = call;
    const state: IRewriterVisitorState = {
        accessedVariables: new Set<string>(),
        call,
        environment: isParallelFunctor(method) ? functor.scope.generateUidIdentifier("environment") : undefined,
        module: moduleFunctionRegistry
    };

    functor.traverse(RewriterVisitor, state);

    if (state.accessedVariables.size > 0 && state.environment) {
        // conversion is needed, arrow functions do not bind their own arguments...
        functor.arrowFunctionToShadowed();
        // Can we just do so? Access to this and arguments is prohibited anyway... we kind of are doing the shadowing ourself.
        // Eg. test if access to outer arguments is correctly detected
        (functor.node as any).shadow = false;

        functor.get("body.body.0").insertBefore(template("const ENVIRONMENT = arguments[arguments.length - 1];")({ENVIRONMENT: state.environment}));

        const environmentProvider = createEnvironmentExtractor(state.accessedVariables, functor);
        addInEnvironmentCall(call.callExpression, environmentProvider);
    }
}
