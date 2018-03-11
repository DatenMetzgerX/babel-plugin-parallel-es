import { TransformOptions } from "babel-core";
import { Visitor } from "babel-traverse";
import { BabylonOptions } from "babylon";

export interface IBabelPlugin {
  visitor: Visitor;
  inherits?: any;
  manipulateOptions?(options: TransformOptions, parserOptions: BabylonOptions, file: any): void;
}
