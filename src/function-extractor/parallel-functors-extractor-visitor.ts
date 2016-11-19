import * as t from "babel-types";
import {NodePath, Visitor} from "babel-traverse";
import {ModuleFunctionsRegistry} from "../module-functions-registry";
import {ModulesUsingParallelRegistry} from "../modules-using-parallel-registry";
import {StatefulParallelFunctorsExtractorVisitor} from "./stateful-parallel-functors-extractor-visitor";
import {RawSourceMap} from "source-map";
import {TransformOptions} from "babel-core";

function getSourceMap(path: NodePath<t.Program>): RawSourceMap {
    let inputSourceMap = path.hub.file.opts.inputSourceMap as RawSourceMap;
    if (inputSourceMap) {
        // Important, babel modifies the input source map when merging it with the outpout source map, but we need
        // to source map containing exactly this state!
        return Object.assign({}, inputSourceMap);
    }

    const filename = path.hub.file.opts.filename;
    // No input source map given, create an empty mapping that just contains the source contents so that
    // the content is available in the worker rewriter.
    return {
        file: filename,
        mappings: "",
        names: [],
        sourceRoot: path.hub.file.opts.sourceRoot,
        sources: [filename],
        sourcesContent: [path.hub.file.code],
        version: 3
    };
}

/**
 * Creates a new babel-plugin that extract all functors passed to parallel.* and registers them in the passed in registry
 * @param modulesUsingParallelRegistry the registry into which the modules with the functors should be registered
 * @returns the babel plugin instance
 */
export function ParallelFunctorsExtractorVisitor (modulesUsingParallelRegistry: ModulesUsingParallelRegistry): Visitor {

    return {
        Program: {
            /**
             * Visit in exit so that all other plugins had the time to rewrite the code before we traverse deep.
             */
            exit(path: NodePath<t.Program>) {
                const options = path.hub.file.opts as TransformOptions;
                const filename = options.filenameRelative || options.filename!;
                const moduleFunctionRegistry = new ModuleFunctionsRegistry(filename, path.scope, getSourceMap(path));

                modulesUsingParallelRegistry.remove(filename);

                path.traverse(StatefulParallelFunctorsExtractorVisitor, moduleFunctionRegistry);
                if (!moduleFunctionRegistry.empty) {
                    modulesUsingParallelRegistry.add(moduleFunctionRegistry);
                }
            }
        }
    };
}
