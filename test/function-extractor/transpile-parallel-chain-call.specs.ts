import * as sinon from "sinon";
import {expect, use} from "chai";
import * as sinonChai from "sinon-chai";

import * as t from "babel-types";
import {transform} from "babel-core";
import {NodePath} from "babel-traverse";

import {transpileParallelChainCall} from "../../src/function-extractor/transpile-parallel-chain-call";
import {ModuleFunctionsRegistry} from "../../src/function-extractor/module-functions-registry";
import {PARALLEL_METHODS} from "../../src/function-extractor/parallel-methods";

use(sinonChai);

describe("TranspileParallelChainCall", function () {

    let registry: ModuleFunctionsRegistry;

    beforeEach(function () {
        registry = new ModuleFunctionsRegistry("test.js");
    });

    describe("Imports", function () {
        it("registers namespace imports", function () {
            // arrange
            const addNamespaceSpy = sinon.spy(registry.imports, "addNamespaceImport");

            // act
            const {functor} = transpile(`
            import * as _ from "lodash";
            import parallel from "parallel-es";
            
            parallel.from([1, 2, '3']).map(value => _.isNumber(value));
            `, "program.body[2].expression", "arguments[0]");

            // assert
            expect(addNamespaceSpy).to.have.been.calledWith("lodash", "_", functor);
        });

        it("registers default imports", function () {
            // arrange
            const addDefaultImportSpy = sinon.spy(registry.imports, "addDefaultImport");

            // act
            const {functor} = transpile(`
            import generate from "babel-generator";
            import parallel from "parallel-es";
            
            parallel.from(asts).map(ast => generate(ast));
            `, "program.body[2].expression", "arguments[0]");

            // assert
            expect(addDefaultImportSpy).to.have.been.calledWith("babel-generator", "generate", functor);
        });

        it("registers named import", function () {
            // arrange
            const addImportSpy = sinon.spy(registry.imports, "addImport");

            // act
            const {functor} = transpile(`
            import {isNumber} from "lodash";
            import parallel from "parallel-es";
            
            parallel.from([1, 2, '3']).map(value => isNumber(value));
            `, "program.body[2].expression", "arguments[0]");

            // assert
            expect(addImportSpy).to.have.been.calledWith("lodash", "isNumber", "isNumber", functor);
        });
    });

    describe("Environment", function () {
        it("adds an inEnvironment call if a variable from the outer scope is accessed inside of a functor and rewrites the variable access to environment.variableName", function () {
            // act
            const { code } = transpile(`
            import parallel from "parallel-es";
            
            const x = 10;
            parallel.from([1, 2, 3]).map(function (value) { return value * x; });
            `, "program.body[2].expression", "arguments[0]");

            // assert
            expect(code).to.include(`parallel.from([1, 2, 3]).inEnvironment(_environmentExtractor()).map(function (value) {
            const _environment = arguments[arguments.length - 1];
            return value * _environment.x;
});`);
        });

        it("adds a environment extractor function exactly above the line where the functor is defined", function () {
            // act
            const { code } = transpile(`
            import parallel from "parallel-es";
            
            const x = 10;
            parallel.from([1, 2, 3]).map(function (value) { return value * x; });
            `, "program.body[2].expression", "arguments[0]");

            // assert
            expect(code).to.include(`const x = 10;

function _environmentExtractor() {
            return {
                        x: x
            };
}`);
        });

        it("does neither add an inEnvironment call nor an environment extractor function if the functor accesses no variables from the outer scope", function () {
            // act
            const { code } = transpile(`
            import parallel from "parallel-es";
            
            const x = 10;
            parallel.from([1, 2, 3]).map(function (value) { return value * 2; });
            `, "program.body[2].expression", "arguments[0]");

            // assert
            expect(code.trim()).to.equal(`import parallel from "parallel-es";

const x = 10;
parallel.from([1, 2, 3]).map(function (value) {
            return value * 2;
});`);
        });

        it("converts ArrowFunctionExpression-functors to function expressions to get access to the arguments", function () {
            // act
            const { code } = transpile(`
            import parallel from "parallel-es";
            
            const x = 10;
            parallel.from([1, 2, 3]).map(value => value * x);
            `, "program.body[2].expression", "arguments[0]");

            // assert
            expect(code).to.include(`parallel.from([1, 2, 3]).inEnvironment(_environmentExtractor()).map(function (value) {
            const _environment = arguments[arguments.length - 1];
            return value * _environment.x;
});`);
        });

        it("throws an error if a function not supporting access to environment variables access variables from the outer scope", function () {
            // arrange
            const transpileCall = () => transpile(`
                import parallel from "parallel-es";
                
                const x = 10;
                parallel.from([1, 2, 3]).map(value => value * 2).inEnvironment(() => ({ x }));
                `, "program.body[2].expression", "arguments[0]");

            // act, assert
            expect(transpileCall).throws("Access to variables from outside of the function scope are not permitted in parallel methods not accepting an environment.");
        });

        it("throws if a non static variable is accessed inside of a functor", function () {
            // arrange
            const transpileCall = () => transpile(`
                import parallel from "parallel-es";
                
                let x = 10;
                parallel.from([1, 2, 3]).map(value => value * x);
                
                x = 15;
                `, "program.body[2].expression", "arguments[0]");

            // act, assert
            expect(transpileCall).throws("Only constant variables (const, var and let variables with a single assignment) can be accessed inside of a parallel function.");
        });

        it("throws if this is used inside of a functor", function () {
            // arrange
            const transpileCall = () => transpile(`
                import parallel from "parallel-es";
                
                const transformer = {
                    x: 10,
                    map(value) {
                        return value * this.x;
                    }
                };
                
                parallel.from([1, 2, 3]).map(transformer.map);
                `, "program.body[2].expression", "program.body[1].declarations[0].init.properties[1]", { functorPathRelative: false });

            // act, assert
            expect(transpileCall).throws("This cannot be accessed inside of a function passed to a parallel method, this is always undefined.");
        });
    });

    function transpile(code: string, callPath: string, functorPath: string, userOptions?: { functorPathRelative?: boolean, methodName?: string }): { functor: NodePath<t.Function>, call: NodePath<t.CallExpression>, code: string } {
        const result = {
            call: undefined as NodePath<t.CallExpression> | undefined,
            functor: undefined as NodePath<t.Function> | undefined
        };

        const options = Object.assign({ functorPathRelative: true, methodName: undefined}, userOptions);
        const fullFunctorPath = options.functorPathRelative ? `${callPath}.${functorPath}` : functorPath;

        function transpileIfFunctorAndCallCollected(current: NodePath<any>) {
            if (result.call && result.functor) {
                const methodName = options.methodName || ((result.call.node.callee as t.MemberExpression).property as t.Identifier).name;
                transpileParallelChainCall({ callExpression: result.call, functor: result.functor, method: PARALLEL_METHODS[methodName]}, registry);
                current.stop();
            }
        }

        const transformResult = transform(code, {
            plugins: [
                {
                    visitor: {
                        Function(path: NodePath<t.Function>) {
                            if (path.getPathLocation() === fullFunctorPath) {
                                path.assertFunction();
                                result.functor = path as NodePath<t.Function>;
                                transpileIfFunctorAndCallCollected(path);
                            }
                        },

                        CallExpression(path: NodePath<t.CallExpression>) {
                            if (path.getPathLocation() === callPath) {
                                path.assertCallExpression();
                                result.call = path as NodePath<t.CallExpression>;
                                transpileIfFunctorAndCallCollected(path);
                            }
                        }
                    }
                }
            ]
        });

        if (!result.call) {
            throw new Error(`Call Expression with path ${callPath} not found.`);
        }

        if (!result.functor) {
            throw new Error(`Functor with full path ${fullFunctorPath} not found.`);
        }

        return { call: result.call!, code: transformResult.code!, functor: result.functor! };
    }
});
