import * as t from "babel-types";

export type FunctionNode = t.FunctionExpression | t.FunctionDeclaration | t.ArrowFunctionExpression;

/**
 * The registration of a single functor
 */
export interface IFunctorRegistration {
    /**
     * The unique id that is used to identify the functor
     */
    readonly identifier: string;

    /**
     * The node defining the functor
     */
    readonly node: FunctionNode;
}
