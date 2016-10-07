import codeFrame = require("babel-code-frame");
import * as t from "babel-types";
import {NodePath} from "babel-traverse";
import {IFunctorRegistration} from "./function-registration";

export function warn(path: NodePath<t.Node>, message: string) {
    message += "\n" + codeFrame(path.hub.file.code, path.node.loc.start.line, path.node.loc.start.column);
    path.hub.file.log.warn(message);
}

export function createFunctionId(registration: IFunctorRegistration) {
    return t.objectExpression([
        t.objectProperty(t.identifier("identifier"), t.stringLiteral(registration.identifier)),
        t.objectProperty(t.identifier("_______isFunctionId"), t.booleanLiteral(true))
    ]);
}

export function createSerializedFunctionCall(functionId: t.ObjectExpression, parameters: Array<t.Expression | t.SpreadElement>) {
    return t.objectExpression([
        t.objectProperty(t.identifier("functionId"), functionId),
        t.objectProperty(t.identifier("parameters"), t.arrayExpression(parameters)),
        t.objectProperty(t.identifier("______serializedFunctionCall"), t.booleanLiteral(true))
    ]);
}
