import {SHARED_MODULES_USING_PARALLEL_REGISTRY} from "../modules-using-parallel-registry";
import {IBabelPlugin} from "../babel-plugin";
import {BabylonOptions} from "babylon";
import {ParallelFunctorsExtractorVisitor} from "./parallel-functors-extractor-visitor";
import {TransformOptions} from "babel-core";

export default function FunctionExtractorPlugin(): IBabelPlugin {
    return {
        manipulateOptions(options: TransformOptions, parserOptions: BabylonOptions): void {
            // workaround for https://github.com/babel/babel/pull/4570#issuecomment-249586438
            parserOptions.sourceFilename = options.filename;
        },

        visitor: ParallelFunctorsExtractorVisitor(SHARED_MODULES_USING_PARALLEL_REGISTRY)
    };
}
