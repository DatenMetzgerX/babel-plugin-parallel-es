/// <reference types="../../node_modules/@types/babel-core" />

import {Visitor} from 'babel-traverse';

declare module "babel-core" {
    export interface Plugin {
        visitor: Visitor;
    }
    export class OptionManager {
        static normalisePlugin(plugin: any): Plugin;
    }
}
