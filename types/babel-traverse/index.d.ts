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

        /**
         * converts the arrow function to a shadowed function expression
         */
        arrowFunctionToShadowed(): void;

        setup(parentPath: NodePath<t.Node>, container: Object | Object[], listKey: string, key: string): void;
    }
}
