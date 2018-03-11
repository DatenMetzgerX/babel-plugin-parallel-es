/// <reference types="../../node_modules/@types/babel-core" />

import { Visitor } from "babel-traverse";

declare module "babel-core" {
  // tslint:disable-next-line:interface-name
  export interface Plugin {
    visitor: Visitor;
  }
  export class OptionManager {
    public static normalisePlugin(plugin: any): Plugin;
  }
}
