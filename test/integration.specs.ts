import * as fs from "fs";
import * as path from "path";
import {expect,  use} from "chai";
import * as sinon from "sinon";
import * as sinonChai from "sinon-chai";

use(sinonChai);

import {transform, transformFileSync} from "babel-core";
import FunctionExtractorPlugin from "../src/function-extractor/function-extractor-plugin";
import WorkerReWriterPlugin from "../src/worker-rewriter/worker-rewriter-plugin";
import {SHARED_MODULES_USING_PARALLEL_REGISTRY} from "../src/modules-using-parallel-registry";

/**
 * Runs the test cases from the ./cases directory. Depending on the outcome of the transformation, the test case filename differs
 *
 * * Successful: The filename has to end with -case.js. The expected output is defined in the -expected.js and -expected-worker.js files
 * * Warning: If the transpiler should output a warning, then the file has to end with -warn-case.js. The expected warning is defined in -warn-expected.txt
 * * Error: Should the transpilation result in an error, then the file has to end with -error-case.js. The expected error message is defined in -error-expected.txt
 *
 */
describe("IntegrationTests", function () {
    const testCasesDirName = path.resolve(__dirname, "./cases");
    let consoleWarn: sinon.SinonSpy;

    beforeEach(function () {
        consoleWarn = sinon.spy(console, "warn");
    });

    afterEach(function () {
        consoleWarn.restore();
        SHARED_MODULES_USING_PARALLEL_REGISTRY.reset();
    });

    const files = fs.readdirSync(testCasesDirName);
    for (const file of files) {
        if (!file.endsWith("-case.js")) {
            continue;
        }

        const fullFilename = path.join(testCasesDirName, file);

        it(`Transforms the file '${file}' correctly`, function () {
            // arrange
            const errorCase = file.endsWith("error-case.js");
            const warnCase = file.endsWith("warn-case.js");
            const expectedFileExtension = errorCase || warnCase ? ".txt" : ".js";
            const expectedFileName = fullFilename.replace("-case.js", `-expected${expectedFileExtension}`);
            const expectedWorkerFileName = fullFilename.replace("-case.js", "-expected-worker.js");

            if (!fs.existsSync(expectedFileName)) {
                throw new Error(`The expected result (${expectedFileName}) for the test case ${file} is missing.`);
            }

            if (!errorCase && !warnCase && !fs.existsSync(expectedWorkerFileName)) {
                throw new Error(`The expected worker result (${expectedWorkerFileName}) for the test case ${file} is missing.`);
            }

            const expected = fs.readFileSync(expectedFileName, "utf-8");
            const expectedWorker = (errorCase || warnCase) ? undefined : fs.readFileSync(expectedWorkerFileName, "utf-8");

            try {
                const code = fs.readFileSync(fullFilename, "utf-8");
                const result = transform(code, {
                    babelrc: false,
                    filename: file,
                    filenameRelative: file,
                    highlightCode: false,
                    plugins: [ FunctionExtractorPlugin() ]
                });

                const workerResult = transformFileSync(require.resolve("parallel-es/dist/worker-slave.parallel-es6.js"), {
                    babelrc: false,
                    plugins: [ WorkerReWriterPlugin() ]
                });

                if (warnCase) {
                    expect(consoleWarn).to.have.been.called;
                    expect(consoleWarn.args[0][0]).to.equal(expected);
                } else {
                    expect(consoleWarn).not.to.have.been.called;
                    expect(result.code).to.equal(expected);

                    const workerExpectations = expectedWorker!.split("/* SPLIT ASSERTION */");
                    for (const workerExpectation of workerExpectations) {
                        expect(workerResult.code).to.include(workerExpectation!.trim(), `Worker Code \n${workerResult.code}\n did not include ${workerExpectation}`);
                    }
                }

            } catch (error) {
                if (errorCase && Error && error._babel) {
                    expect(error.stack).to.include(expected);
                } else {
                    throw error;
                }
            }
        });
    }
});
