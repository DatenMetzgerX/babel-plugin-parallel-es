import codeFrame = require("babel-code-frame");
import * as t from "babel-types";
import { NodePath, Scope } from "babel-traverse";

export function warn(path: NodePath<t.Node>, message: string) {
  message += "\n" + codeFrame(path.hub.file.code, path.node.loc.start.line, path.node.loc.start.column);
  path.hub.file.log.warn(message);
}

export function createFunctionId(identifier: string) {
  return t.objectExpression([
    t.objectProperty(t.identifier("identifier"), t.stringLiteral(identifier)),
    t.objectProperty(t.identifier("_______isFunctionId"), t.booleanLiteral(true))
  ]);
}

export function createSerializedFunctionCall(
  functionId: t.ObjectExpression,
  parameters: Array<t.Expression | t.SpreadElement>
) {
  return t.objectExpression([
    t.objectProperty(t.identifier("functionId"), functionId),
    t.objectProperty(t.identifier("parameters"), t.arrayExpression(parameters)),
    t.objectProperty(t.identifier("______serializedFunctionCall"), t.booleanLiteral(true))
  ]);
}

/**
 * Converts a given function to a function declaration (if this is possible).
 * @param func the function to convert
 * @param scope the scope where the function resists. Needed to generate unique identifiers
 * @returns the function as function declaration
 */
export function toFunctionDeclaration(func: t.Function, scope: Scope): t.FunctionDeclaration {
  if (t.isFunctionDeclaration(func)) {
    return func;
  }

  if (t.isArrowFunctionExpression(func)) {
    (t as any).ensureBlock(func);
    func.expression = false;
    (func as any).type = "FunctionExpression";
    (func as any).shadow = (func as any).shadow || true;
  }

  if (t.isFunctionExpression(func)) {
    const id = func.id || scope.generateUidIdentifier("anonymous");
    return t.functionDeclaration(id, func.params, func.body, func.generator, func.async);
  }

  throw new Error(`Not supported conversion of ${func.type} to a FunctionDeclaration.`);
}
