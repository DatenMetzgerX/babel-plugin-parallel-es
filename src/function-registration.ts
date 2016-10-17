import * as t from "babel-types";

/**
 * The registration of a entry function
 */
export interface IEntryFunctionRegistration {
    /**
     * The unique id that is used to identify the functor
     */
    readonly functionId: string;

    /**
     * The node defining the functor
     */
    readonly node: t.FunctionDeclaration;

    /**
     * The identifier that references the function node
     */
    readonly identifier: t.Identifier;
}
