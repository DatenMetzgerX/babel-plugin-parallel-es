import * as t from "babel-types";
import {parse} from "babylon";
import {NodePath} from "babel-traverse";
import {transformFromAst} from "babel-core";

/**
 * Returns the node path for the program node of the given code
 * @param code the code for which the path should be retrieved
 */
export function toPath(code: string): NodePath<t.Program>;

/**
 * Returns the path for the given node
 * @param node the node for which the path is to be retrieved
 */
export function toPath<T extends t.Expression | t.Statement>(node: T): NodePath<T>;

export function toPath(node: t.Node | string): NodePath<t.Node> {
    let root: t.Node;
    if (typeof node === "string") {
        root = parse(node, { sourceType: "module" });
    } else {
        let statement: t.Statement;
        if (t.isStatement(node)) {
            statement = node;
        } else {
            statement = t.expressionStatement(node as t.Expression);
        }
        root = t.file(t.program([statement]));
    }

    let nodePath: NodePath<t.Node> | undefined = undefined;

    transformFromAst(root, undefined, {
        plugins: [{
            visitor: {
                Program(path: NodePath<t.Program>) {
                    if (typeof node === "string") {
                        nodePath = path;
                    } else {
                        const statementPath = path.get("body.0");
                        if (t.isStatement(node)) {
                            nodePath = statementPath;
                        } else {
                            nodePath = statementPath.get("expression");
                        }
                    }
                }
            }
        }]
    });

    return nodePath!;
}
