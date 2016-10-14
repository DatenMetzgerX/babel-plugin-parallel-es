import {NodePath} from "babel-traverse";
import * as t from "babel-types";
import {ParallelMethod} from "./parallel-methods";

export interface IParallelChainCall {
    callExpression: NodePath<t.CallExpression>;
    method: ParallelMethod;
    functor: NodePath<t.Function>;
}
