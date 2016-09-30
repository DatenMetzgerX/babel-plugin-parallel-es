import * as t from "babel-types";

export type FunctionNode = t.FunctionExpression | t.FunctionDeclaration | t.ArrowFunctionExpression;

export interface IFunctionRegistration {
    identifier: string,
    node: FunctionNode,
}