import {Visitor, NodePath} from "babel-traverse";
import * as t from "babel-types";
import {createFunctionId} from "../util";
import {ModulesUsingParallelRegistry} from "../modules-using-parallel-registry";
import {IFunctorRegistration} from "../function-registration";
import {WORKER_FUNCTORS_REGISTRATION_MARKER} from "../constants";

/**
 * Removes the worker slave marker from a leading or trailing comment
 * @param path the path from which the comment should be removed
 * @returns {boolean} true if the marker is in the leading comments.
 */
function removeAfterWorkerSlaveMarker(path: NodePath<t.Node>): boolean {
    function removeFrom(commentsName: string) {
        if (!(path.node as any)[commentsName]) {
            return false;
        }

        const comments = (path.get(commentsName) as any) as Array<NodePath<t.Comment>>;
        const marker = comments.find(comment => comment.node.value.includes(WORKER_FUNCTORS_REGISTRATION_MARKER));

        if (marker) {
            marker.remove();
            return true;
        }
        return false;
    }

    removeFrom("trailingComments");
    return removeFrom("leadingComments");
}

function registerStaticFunction(insertionPoint: NodePath<t.Statement>, definition: IFunctorRegistration) {
    const id = createFunctionId(definition);

    let functionDefinition = definition.node as t.FunctionDeclaration | t.FunctionExpression | t.ArrowFunctionExpression;
    let functorReference: t.Expression;

    if (t.isFunctionDeclaration(functionDefinition)) {
        functionDefinition.id = insertionPoint.scope.generateUidIdentifierBasedOnNode(functionDefinition.id);
        insertionPoint.insertBefore(definition.node);
        functorReference = functionDefinition.id;
    } else {
        functorReference = functionDefinition as t.FunctionExpression | t.ArrowFunctionExpression;
    }

    const registerStaticFunctionMember = t.memberExpression(t.identifier("slaveFunctionLookupTable"), t.identifier("registerStaticFunction"));
    const registerCall = t.callExpression(registerStaticFunctionMember, [id, functorReference]);
    insertionPoint.insertBefore(t.expressionStatement(registerCall));
}

export function createReWriterVisitor(registry: ModulesUsingParallelRegistry): Visitor {
    return {
        Statement(path: NodePath<t.Statement>) {
            if (!removeAfterWorkerSlaveMarker(path)) {
                return;
            }

            for (const module of registry.modules) {
                for (const definition of module.functions) {
                    registerStaticFunction(path, definition);
                }
            }
        }
    };
}
