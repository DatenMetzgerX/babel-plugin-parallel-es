import * as t from "babel-types";
import {StaticFunctionRegistry} from "./static-function-registry";
import {NodePath} from "babel-traverse";

function getParallelObject(path: NodePath<any>): NodePath<t.Identifier> | undefined {
    if (path.getData("parallelObject")) {
        return path.getData("parallelObject");
    }

    if (path.isIdentifier()) {
        const binding = path.scope.getBinding(path.node.name);

        if (binding) {
            if (binding.path.isImportDefaultSpecifier()) {
                const importStatement = binding.path.parent as t.ImportDeclaration;

                if (importStatement.source.value === "parallel-es") {
                    return binding.path.get("identifier") as NodePath<t.Identifier>;
                }
            } else if (binding.path.isVariableDeclarator() && t.isCallExpression(binding.path.node.init)) {
                const init = binding.path.node.init;
                return t.isCallExpression(init) && t.isIdentifier(init.callee) && init.arguments.length > 0 && t.isStringLiteral(init.arguments[0]) && init.arguments[0].value === "parallel-es";
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


export function ParallelESVisitor (functionRegistry: StaticFunctionRegistry) {
    return {
        CallExpression:  {
            enter(path: NodePath<t.CallExpression>) {
                if (t.isMemberExpression(path.node.callee) && isParallelObject(path.get("callee.object"))) {
                    path.setData("parallelChain", path.get("callee.object"));
                }
            },

            exit(path: NodePath<t.CallExpression>) {
                if (!t.isMemberExpression(path.node.callee) || !isParallelObject(path.get("callee.object"))) {
                    return;
                }

                const methodName = getParallelMethodName(path.get("callee") as NodePath<t.MemberExpression>);

                if (!methodName) {
                    return;
                }

                console.log(methodName);
                if (methodName === "map") {
                    const mapper: NodePath<any> = path.node.arguments.length > 0 ? path.get("arguments")[0] : undefined;
                    if (mapper) {
                        let mapperDeclaration: NodePath<t.FunctionDeclaration | t.ArrowFunctionExpression | t.FunctionExpression>;
                        if (t.isIdentifier(mapper)) {
                            const binding = path.scope.getBinding((mapper.node as t.Identifier).name);
                            mapperDeclaration = binding.path;
                        } else if (t.isFunctionExpression(mapper) || t.isArrowFunctionExpression(mapper)) {
                            mapperDeclaration = mapper.node;
                        } else {
                            throw new Error("unknown mapper function type");
                        }


                        const registration = functionRegistry.registerStaticFunction(mapperDeclaration);

                        mapper.replaceWith(t.objectExpression([
                            t.objectProperty(t.identifier("identifier"), t.stringLiteral(registration.identifier)),
                            t.objectProperty(t.identifier("_______isFunctionId"), t.booleanLiteral(true))
                        ]));
                    }
                }
            }
        }
    };
}
