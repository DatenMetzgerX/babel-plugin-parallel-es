import * as t from "babel-types";
import {NodePath, Visitor} from "babel-traverse";
import {ModuleFunctionsRegistry} from "./module-functions-registry";
import {ModulesUsingParallelRegistry} from "./modules-using-parallel-registry";
import {StatefulParallelFunctorsExtractorVisitor} from "./stateful-parallel-functors-extractor-visitor";

/**
 * Creates a new babel-plugin that extract all functors passed to parallel.* and registers them in the passed in registry
 * @param modulesUsingParallelRegistry the registry into which the modules with the functors should be registered
 * @returns the babel plugin instance
 */
export function ParallelFunctorsExtractorVisitor (modulesUsingParallelRegistry: ModulesUsingParallelRegistry): Visitor {

    return {
        Program(path: NodePath<t.Program>) {
            // Important, babel modifies the input source map when merging it with the outpout source map, but we need
            // to source map containing exactly this state!
            const map = Object.assign({}, path.hub.file.opts.inputSourceMap);
            const filename = path.hub.file.opts.filename;
            const moduleFunctionRegistry = new ModuleFunctionsRegistry(filename, map);

            modulesUsingParallelRegistry.remove(filename);

            path.traverse(StatefulParallelFunctorsExtractorVisitor, moduleFunctionRegistry);
            if (!moduleFunctionRegistry.empty) {
                modulesUsingParallelRegistry.add(moduleFunctionRegistry);
            }
        }
    };
}
