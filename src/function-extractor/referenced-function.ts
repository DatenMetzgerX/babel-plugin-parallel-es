import * as t from "babel-types";

export class ReferencedFunction {
    public references: t.Node[] = [];

    constructor(public func: t.Function) {
    }
}
