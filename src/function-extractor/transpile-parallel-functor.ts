import traverse, {NodePath, Binding, Scope} from "babel-traverse";
import * as t from "babel-types";
import {ModuleFunctionsRegistry} from "../module-functions-registry";
import {toFunctionDeclaration} from "../util";
import {
    TranspileParallelFunctorState, ITranspileParallelFunctorState,
    TranspileParallelFunctorChildState
} from "./transpile-parallel-functor-state";
import {ITranspileParallelFunctorResult} from "./transpile-parallel-functor-result";

/**
 * Registers the import defined by the given binding
 * @param binding the import binding
 * @param moduleFunctionsRegistry the registry that stores the imports
 * @param reference the identifier that references the imported symbol
 */
function registerImport(binding: Binding, moduleFunctionsRegistry: ModuleFunctionsRegistry, reference: t.Identifier) {
    binding.path.parentPath.assertImportDeclaration();

    const importNode = binding.path.node as t.ImportDefaultSpecifier | t.ImportNamespaceSpecifier | t.ImportSpecifier;
    const importDeclaration = binding.path.parent as t.ImportDeclaration;
    const source = binding.path.hub.file.resolveModuleSource(importDeclaration.source.value) as string;

    if (t.isImportDefaultSpecifier(importNode)) {
        moduleFunctionsRegistry.imports.addDefaultImport(source, importNode.local.name, reference);
    } else if (t.isImportNamespaceSpecifier(importNode)) {
        moduleFunctionsRegistry.imports.addNamespaceImport(source, importNode.local.name, reference);
    } else if (t.isImportSpecifier(importNode)) {
        moduleFunctionsRegistry.imports.addImport(source, importNode.imported.name, importNode.local.name, reference);
    } else {
        throw binding.path.buildCodeFrameError("Unknown import declaration");
    }
}

/**
 * Resolves a binding in the functor scope
 * @param name the name to resolve
 * @param start the path from which the resolving should start
 * @param functorScope the functor scope
 * @returns {Binding|undefined} the binding, if the name is defined inside of the functor or false otherwise
 */
function resolveInFunctorScope(name: string, start: NodePath<t.Node>, functorScope: Scope): Binding | undefined {
    /* tslint:disable:no-conditional-assignment */
    let scope = start.scope;
    let binding: Binding | undefined = undefined;
    do {
        binding = scope.getOwnBinding(name);
    } while (!binding && ((scope = scope.parent) !== functorScope.parent));

    return binding;
}

function transpileReferencedFunction (referencedFunction: NodePath<t.Function>, reference: NodePath<t.Identifier>, state: ITranspileParallelFunctorState) {
    const childState = new TranspileParallelFunctorChildState(referencedFunction, state);
    const transpilationResult = _transpileParallelFunctor(referencedFunction, childState);
    state.module.registerFunction(transpilationResult.transpiledFunctor);

    reference.replaceWith(transpilationResult.transpiledFunctor.id);
    reference.skip(); // don't visit the inserted id...
}

/**
 * Rewrites an access to a binding from outside of the functor scope.
 * Supports access to constant variables and functions.
 * @param path the path that references the binding
 * @param binding the binding from outside of the functor declaration that needs to be made available inside of the functor
 * @param state the state
 */
function rewriteReferenceToOuterScope(path: NodePath<t.Identifier>, binding: Binding, state: ITranspileParallelFunctorState) {
    if (!state.hasEnvironment) {
        throw path.buildCodeFrameError("Access to variables from outside of the function scope are not permitted in parallel methods not accepting an environment.");
    }

    if (binding.path.isVariableDeclarator() && binding.path.get("init").isFunction()) {
        transpileReferencedFunction(binding.path.get("init") as NodePath<t.Function>, path, state);
    } else if (t.isFunction(binding.path.node)) {
        transpileReferencedFunction(binding.path as NodePath<t.Function>, path, state);
    } else {
        state.addAccessedVariable(path.node.name);
    }
}

const RewriterVisitor = {
    enter(path: NodePath<t.Node>, state: ITranspileParallelFunctorState) {
        path.hub = state.originalFunctor.hub;
    },

    ThisExpression(path: NodePath<t.ThisExpression>) {
        throw path.buildCodeFrameError("This cannot be accessed inside of a function passed to a parallel method, this is always undefined.");
    },

    ReferencedIdentifier(path: NodePath<t.Identifier>, state: ITranspileParallelFunctorState) {
        const localBinding = resolveInFunctorScope(path.node.name, path, state.scope);

        if (localBinding) {
            return;
        }

        // it is a binding that is defined outside of the functor, therefore the rewriter must make it available somehow...
        // if there is no rule that can make it available, bark!
        const binding = path.scope.getBinding(path.node.name);

        if (!binding) {
            return; // Globally defined objects like Math
        } else if ((binding.kind as string) === "module") {
            registerImport(binding, state.module, path.node);
        } else if (binding.constant) {
            rewriteReferenceToOuterScope(path, binding, state);
        } else {
            throw path.buildCodeFrameError("Only constant variables (const, var and let variables with a single assignment) can be accessed inside of a parallel function.");
        }
    }
};

function _transpileParallelFunctor(originalFunctor: NodePath<t.Function>, state: ITranspileParallelFunctorState): ITranspileParallelFunctorResult {
    let result = state.module.getFunctionTranspilationResult(originalFunctor.node);

    if (!result) {
        const clonedFunctor = (t as any).cloneDeep(originalFunctor.node);
        const transpiledFunctor = toFunctionDeclaration(clonedFunctor, state.scope);

        traverse(transpiledFunctor, RewriterVisitor, state.scope, state);

        result = { environmentVariables: state.accessedVariables, transpiledFunctor };
        state.module.addFunctionTranspilationResult(originalFunctor.node, result);
    }

    return result;
}

/**
 * Transpiles a functor and returns it
 * @param originalFunctor the functor to transpile
 * @param moduleFunctionRegistry the module registry
 * @param hasEnvironment does this functor support an environment variable or not?
 * @returns {ITranspileParallelFunctorResult} the transpilation result
 */
export function transpileParallelFunctor(originalFunctor: NodePath<t.Function>, moduleFunctionRegistry: ModuleFunctionsRegistry, hasEnvironment: boolean): ITranspileParallelFunctorResult {
    const state = new TranspileParallelFunctorState(originalFunctor, moduleFunctionRegistry);
    state.hasEnvironment = hasEnvironment;

    return _transpileParallelFunctor(originalFunctor, state);
}
