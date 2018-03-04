import { RawSourceMap, SourceMapConsumer, SourceMapGenerator } from "source-map";
import { ModuleFunctionsRegistry } from "../module-functions-registry";

function removeSourceFromMap(sourceToRemove: string, map: RawSourceMap): RawSourceMap {
  const consumer = new SourceMapConsumer(map);
  const generator = new SourceMapGenerator({ file: map.file, sourceRoot: map.sourceRoot });

  map.sources.forEach(function(sourceFile) {
    if (sourceFile === sourceToRemove) {
      return;
    }

    const content = consumer.sourceContentFor(sourceFile);
    if (content != null) {
      generator.setSourceContent(sourceFile, content);
    }
  });

  consumer.eachMapping(function(mapping) {
    if (mapping.source !== sourceToRemove) {
      generator.addMapping({
        generated: { column: mapping.generatedColumn, line: mapping.generatedLine },
        name: mapping.name,
        original: { column: mapping.originalColumn, line: mapping.originalLine },
        source: mapping.source
      });
    }
  });

  return (generator as any).toJSON();
}

/**
 * Merges source map of the generated code with the input source map and source maps for all modules where
 * functors have been extracted from
 */
export class WorkerSourceMapMerger {
  private moduleMaps: RawSourceMap[] = [];

  /**
   * Creates a new instance
   * @param fileName the name of the output file
   * @param inputSourceMap the input source map
   */
  constructor(private fileName?: string, private inputSourceMap?: RawSourceMap) {}

  /**
   * Sets the modules from which functors have been extracted
   * @param modules the modules
   */
  public setModules(modules: Readonly<ModuleFunctionsRegistry>[]): void {
    this.moduleMaps = modules.filter(module => !!module.map).map(module => module.map!);
  }

  /**
   * Merges the output source map with the input and modules source map
   * @param outputSourceMap the output source map
   * @returns The merged source map or undefined if no source map has been given
   */
  public merge(outputSourceMap?: RawSourceMap): RawSourceMap | undefined {
    if (!outputSourceMap) {
      return undefined;
    }

    const consumer = new SourceMapConsumer(outputSourceMap as RawSourceMap);
    const sourceMapGenerator = SourceMapGenerator.fromSourceMap(consumer);

    if (this.inputSourceMap) {
      sourceMapGenerator.applySourceMap(new SourceMapConsumer(this.inputSourceMap), this.fileName);
    }

    for (const moduleMap of this.moduleMaps) {
      sourceMapGenerator.applySourceMap(new SourceMapConsumer(moduleMap));
    }

    let map = (sourceMapGenerator as any).toJSON() as RawSourceMap;

    if (this.inputSourceMap && this.fileName) {
      map = removeSourceFromMap(this.fileName, map);
    }

    return map;
  }
}
