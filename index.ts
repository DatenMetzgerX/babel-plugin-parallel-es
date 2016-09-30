import {ModulesUsingParallelRegistry} from "./src/modules-using-parallel-registry";
import {BabylonOptions} from "babylon";
import {ParallelFunctorsExtractorVisitor} from "./src/parallel-functors-extractor-visitor";
import {Visitor} from "babel-traverse";
import {TransformOptions} from "babel-core";

export const registry = new ModulesUsingParallelRegistry();

export interface IBabelPlugin {
    visitor: Visitor;
    manipulateOptions(options: TransformOptions, parserOptions: BabylonOptions, file: any): void;
}

export default function (): IBabelPlugin {
    return {
        manipulateOptions(options: TransformOptions, parserOptions: BabylonOptions): void {
            // workaround for https://github.com/babel/babel/pull/4570#issuecomment-249586438
            parserOptions.sourceFilename = options.filename;
        },

        visitor: ParallelFunctorsExtractorVisitor(registry)
    };
};
