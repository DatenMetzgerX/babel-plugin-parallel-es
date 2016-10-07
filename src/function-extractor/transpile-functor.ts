import {NodePath, Binding} from "babel-traverse";
import * as t from "babel-types";
import {ModuleFunctionsRegistry} from "./module-functions-registry";

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
        throw binding.path.buildCodeFrameError("Unknown import type");
    }
}

interface IRewriterVisitorState {
    module: ModuleFunctionsRegistry;
    functor: NodePath<t.Function>;
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

const RewriterVisitor = {
    ReferencedIdentifier(path: NodePath<t.Identifier>, state: IRewriterVisitorState) {
        const localBinding = resolveInFunctorScope(path.node.name, path, state.functor);

        if (!localBinding) {
            // it is a binding that is defined outside of the functor, therefore the rewriter must make it available somehow...
            // if there is no rule that can make it available, bark!
            const binding = path.scope.getBinding(path.node.name);

            if (!binding) {
                return; // Globally defined objects like Math
            } else if ((binding.kind as string) === "module") {
                registerImport(binding, state.module, state.functor);
            } else {
                throw path.buildCodeFrameError("Access to identifier that is not bound inside of the functor");
            }
        }
    }
};

export function transpileFunctor(functor: NodePath<t.Function>, moduleFunctionRegistry: ModuleFunctionsRegistry) {
    return functor.traverse(RewriterVisitor, { functor, module: moduleFunctionRegistry} as IRewriterVisitorState);
}
