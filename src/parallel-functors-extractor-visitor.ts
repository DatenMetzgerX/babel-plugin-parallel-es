import * as t from "babel-types";
import {NodePath, Visitor} from "babel-traverse";
import {ModuleFunctionsRegistry} from "./module-functions-registry";
import {ModulesUsingParallelRegistry} from "./modules-using-parallel-registry";

const PARALLEL_MODULE_NAME = "parallel-es";

function getParallelObject(path: NodePath<any>): NodePath<t.Identifier> | undefined {
    if (path.getData("parallelObject")) {
        return path.getData("parallelObject");
    }

    if (path.isIdentifier()) {
        //  todo store parallel flag on identifier to avoid lookup
        const binding = path.scope.getBinding(path.node.name);

        if (binding) {
            // import parallel from ...
            if (binding.path.isImportDefaultSpecifier()) {
                const importStatement = binding.path.parent as t.ImportDeclaration;

                if (importStatement.source.value === PARALLEL_MODULE_NAME) {
                    return binding.path.get("identifier") as NodePath<t.Identifier>;
                }
            } else if (t.isImportSpecifier(binding.path.node) && (binding.path.parent as t.ImportDeclaration).source.value === PARALLEL_MODULE_NAME && binding.path.node.imported.name === "default") {
                  return binding.path.get("local") as NodePath<t.Identifier>;
            } else if (t.isVariableDeclarator(binding.path.node) && t.isCallExpression(binding.path.node.init) && binding.path.node.init.arguments.length > 0) {
                // require js const parallel = require('parallel...');

                const requireCall = binding.path.node.init;
                if (t.isIdentifier(requireCall.callee) && requireCall.callee.name === "require" && t.isStringLiteral(requireCall.arguments[0]) && (requireCall.arguments[0] as t.StringLiteral).value === PARALLEL_MODULE_NAME) {
                    return binding.path.get("id") as NodePath<t.Identifier>;
                }
            }
        }
    }

    if (path.isCallExpression() && t.isMemberExpression(path.node.callee)) {
        const chain = path.get("callee.object");
        return getParallelObject(chain);
    }

    return undefined;
}

function isParallelObject(object: NodePath<any>): boolean {
    return !!getParallelObject(object);
}

function getParallelMethodName(path: NodePath<t.MemberExpression>): string | undefined {
    path.assertMemberExpression();

    if (t.isIdentifier(path.node.property)) {
        return path.node.property.name;
    }

    return undefined;
}

const StatefulVisitor: Visitor = {
    CallExpression:  {
        enter(path: NodePath<t.CallExpression>) {
            if (t.isMemberExpression(path.node.callee) && isParallelObject(path.get("callee.object"))) {
                path.setData("parallelChain", path.get("callee.object"));
            }
        },

        exit(path: NodePath<t.CallExpression>, moduleFunctionRegistry: ModuleFunctionsRegistry) {
            if (!t.isMemberExpression(path.node.callee) || !isParallelObject(path.get("callee.object"))) {
                return;
            }

            const methodName = getParallelMethodName(path.get("callee") as NodePath<t.MemberExpression>);

            if (!methodName) {
                return;
            }

            path.debug(() => `Found invocation of parallel method ${methodName}`);

            if (methodName === "map") {
                const mapper: NodePath<t.Node> | undefined = path.node.arguments.length > 0 ? path.get("arguments.0") : undefined;
                if (mapper) {
                    let mapperDeclaration: NodePath<t.FunctionDeclaration | t.ArrowFunctionExpression | t.FunctionExpression>;
                    if (t.isIdentifier(mapper.node)) {
                        const binding = path.scope.getBinding(mapper.node.name);
                        // TODO handle case where this might be an identifier referencing a function expression or arrow expression or another variable or what ever.
                        binding.path.assertFunctionDeclaration();

                        mapperDeclaration = binding.path as NodePath<t.FunctionDeclaration>;
                    } else if (t.isFunctionExpression(mapper.node) || t.isArrowFunctionExpression(mapper.node)) {
                        mapperDeclaration = mapper as NodePath<t.FunctionExpression | t.ArrowFunctionExpression>;
                    } else {
                        throw new Error("unknown mapper function type");
                    }

                    const registration = moduleFunctionRegistry.registerFunction(mapperDeclaration);

                    mapper.replaceWith(t.objectExpression([
                        t.objectProperty(t.identifier("identifier"), t.stringLiteral(registration.identifier)),
                        t.objectProperty(t.identifier("_______isFunctionId"), t.booleanLiteral(true))
                    ]));
                }
            }
        }
    }
};

/**
 * Creates a new babel-plugin that extract all functors passed to parallel.* and registers them in the passed in registry
 * @param modulesUsingParallelRegistry the registry into which the modules with the functors should be registered
 * @returns the babel plugin instance
 */
export function ParallelFunctorsExtractorVisitor (modulesUsingParallelRegistry: ModulesUsingParallelRegistry): Visitor {

    return {
        Program(path: NodePath<t.Program>) {
            // Important, babel modifies the input source map when merging it with the outpout source map, but we need
            // to source map containing exactly this state!
            const map = Object.assign({}, path.hub.file.opts.inputSourceMap);
            const filename = path.hub.file.opts.filename;
            const moduleFunctionRegistry = new ModuleFunctionsRegistry(filename, path.hub.file.code, map);

            modulesUsingParallelRegistry.remove(filename);

            path.traverse(StatefulVisitor, moduleFunctionRegistry);
            if (!moduleFunctionRegistry.empty) {
                modulesUsingParallelRegistry.add(moduleFunctionRegistry);
            }
        }
    };
}
