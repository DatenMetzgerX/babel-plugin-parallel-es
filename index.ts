import {StaticFunctionRegistry} from "./src/static-function-registry";
import {BabylonOptions} from "babylon";
import {ParallelESVisitor} from "./src/visitor";

export const registry = new StaticFunctionRegistry();

export default function () {
    return {
        manipulateOptions(options: babel.TransformOptions, parserOptions: BabylonOptions, file: any) {
            // workaround for https://github.com/babel/babel/pull/4570#issuecomment-249586438
            parserOptions.sourceFilename = options.filename;
        },

        visitor: ParallelESVisitor(registry)
    };
}

