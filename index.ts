import WorkerReWriterPlugin from "./src/worker-rewriter/worker-rewriter-plugin";
import FunctionExtractorPlugin from "./src/function-extractor/function-extractor-plugin";
import {ModulesUsingParallelRegistry} from "./src/modules-using-parallel-registry";

export default FunctionExtractorPlugin;

export { WorkerReWriterPlugin, ModulesUsingParallelRegistry };
