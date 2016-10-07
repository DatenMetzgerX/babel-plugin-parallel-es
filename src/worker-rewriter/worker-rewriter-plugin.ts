import {TransformOptions} from "babel-core";
import generate, {GeneratorOptions, GeneratorResult} from "babel-generator";
import {IBabelPlugin} from "../babel-plugin";
import {WorkerSourceMapMerger} from "./worker-source-maps-merger";
import {RawSourceMap} from "source-map";
import {SHARED_MODULES_USING_PARALLEL_REGISTRY} from "../modules-using-parallel-registry";
import {createReWriterVisitor} from "./worker-rewriter-visitor";

export default function WorkerReWriterPlugin(): IBabelPlugin {
    return {
        manipulateOptions(options: TransformOptions) {
            const generatorOpts: GeneratorOptions = (options as any).generatorOpts = (options as any).generatorOpts || {};
            const generator: string | ((...params: any[]) => GeneratorResult) = (generatorOpts as any).generator || generate;

            const inputSourceMap = options.inputSourceMap;

            // unset the input source map, otherwise babel modifies the source map too and removes
            // all content except for the first source... it cannot handle source maps with more then one source file...
            options.inputSourceMap = undefined;

            (generatorOpts as any).generator = function (this: any): GeneratorResult {
                let generateFunc = generate;
                if (typeof generator === "string") {
                    generateFunc = require(generator);
                }

                const result = generateFunc.apply(this, arguments);

                const sourceMapMerger = new WorkerSourceMapMerger(options.filename, inputSourceMap as RawSourceMap);
                sourceMapMerger.setModules(SHARED_MODULES_USING_PARALLEL_REGISTRY.modules);
                const map = sourceMapMerger.merge(result.map);

                return { code: result.code, map: map as Object };
            };
        },

        visitor: createReWriterVisitor(SHARED_MODULES_USING_PARALLEL_REGISTRY)
    };
}
