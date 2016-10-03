/// <reference types="../../node_modules/@types/babel-traverse" />
/// <reference types="../../node_modules/@types/babel-types" />

import * as t from 'babel-types';

declare module "babel-traverse" {
    export interface NodePath<T> {
        resolve(dangerous?: boolean): NodePath<t.Node>;
        toComputedKey(): t.Node | undefined;
        /**
         * Fix for https://github.com/DefinitelyTyped/DefinitelyTyped/pull/11654
         */
        buildCodeFrameError<TError extends Error>(msg: string, Error?: new (msg: string) => TError): TError;
    }
}