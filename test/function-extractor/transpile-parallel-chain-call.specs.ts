import * as sinon from "sinon";
import {expect, use} from "chai";
import * as sinonChai from "sinon-chai";

import * as t from "babel-types";
import {transform} from "babel-core";
import {NodePath, Scope} from "babel-traverse";

import {ModuleFunctionsRegistry} from "../../src/function-extractor/module-functions-registry";
import {PARALLEL_METHODS, isParallelFunctor} from "../../src/function-extractor/parallel-methods";
import {transpileParallelFunctor} from "../../src/function-extractor/transpile-parallel-functor";

use(sinonChai);

describe("TranspileParallelFunctor", function () {

    let registry: ModuleFunctionsRegistry;
    let scope: Scope;
    let hasBindingStub: Sinon.SinonStub;

    beforeEach(function () {
        hasBindingStub = sinon.stub().returns(true);
        scope = { hasBinding: hasBindingStub } as any;
        registry = new ModuleFunctionsRegistry("test.js", scope);
    });

    describe("Imports", function () {
        it("registers namespace imports", function () {
            // arrange
            const addNamespaceSpy = sinon.spy(registry.imports, "addNamespaceImport");

            // act
            transpile(`
            import * as _ from "lodash";
            import parallel from "parallel-es";

            parallel.from([1, 2, '3']).map(value => _.isNumber(value));
            `, "program.body[2].expression", "arguments[0]");

            // assert
            expect(addNamespaceSpy).to.have.been.calledWith("lodash", "_");
        });

        it("registers default imports", function () {
            // arrange
            const addDefaultImportSpy = sinon.spy(registry.imports, "addDefaultImport");

            // act
            transpile(`
            import generate from "babel-generator";
            import parallel from "parallel-es";

            parallel.from(asts).map(ast => generate(ast));
            `, "program.body[2].expression", "arguments[0]");

            // assert
            expect(addDefaultImportSpy).to.have.been.calledWith("babel-generator", "generate");
        });

        it("registers named import", function () {
            // arrange
            const addImportSpy = sinon.spy(registry.imports, "addImport");

            // act
            transpile(`
            import {isNumber} from "lodash";
            import parallel from "parallel-es";

            parallel.from([1, 2, '3']).map(value => isNumber(value));
            `, "program.body[2].expression", "arguments[0]");

            // assert
            expect(addImportSpy).to.have.been.calledWith("lodash", "isNumber", "isNumber");
        });
    });

    describe("Environment", function () {
        it("sets the variables accessed inside a parallel functor", function () {
            // act
            const { environmentVariables } = transpile(`
            import parallel from "parallel-es";

            const x = 10;
            parallel.from([1, 2, 3]).map(function (value) { return value * x; });
            `, "program.body[2].expression", "arguments[0]");

            // assert
            expect(Array.from(environmentVariables)).to.eql(["x"]);
        });

        it("registers additional functions used in the functor", function () {
            transpile(`
            import parallel from "parallel-es";
            
            function helper(x) {
                return x;
            }
            
            parallel.from([1, 2, 3]).map(function (value) { return helper(value); });
            `, "program.body[2].expression", "arguments[0]");

            // assert
            expect(registry.functions).to.have.length(1);
            expect(registry.functions[0]).to.have.deep.property("id.name").that.equals("helper");
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
                    map: function (value) {
                        return value * this.x;
                    }
                };

                parallel.from([1, 2, 3]).map(transformer.map);
                `, "program.body[2].expression", "program.body[1].declarations[0].init.properties[1].value", { functorPathRelative: false });

            // act, assert
            expect(transpileCall).throws("This cannot be accessed inside of a function passed to a parallel method, this is always undefined.");
        });
    });

    function transpile(code: string, callPath: string, functorPath: string, userOptions?: { functorPathRelative?: boolean, methodName?: string }): { ast: t.Node, originalFunctor: NodePath<t.Function>, transpiledFunctor: t.FunctionDeclaration, environmentVariables: string[], callExpression: NodePath<t.CallExpression>, code: string } {
        const result = {
            callExpression: undefined as NodePath<t.CallExpression> | undefined,
            environmentVariables: undefined as string[] | undefined,
            originalFunctor: undefined as NodePath<t.Function> | undefined,
            transpiledFunctor: undefined as t.FunctionDeclaration | undefined
        };

        const options = Object.assign({ functorPathRelative: true, methodName: undefined}, userOptions);
        const fullFunctorPath = options.functorPathRelative ? `${callPath}.${functorPath}` : functorPath;

        function transpileIfFunctorAndCallCollected(current: NodePath<any>) {
            if (result.callExpression && result.originalFunctor) {
                const methodName = options.methodName || ((result.callExpression.node.callee as t.MemberExpression).property as t.Identifier).name;
                const transpileResult = transpileParallelFunctor(result.originalFunctor, registry, isParallelFunctor(PARALLEL_METHODS[methodName]));
                result.transpiledFunctor = transpileResult.transpiledFunctor;
                result.environmentVariables = transpileResult.environmentVariables;
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
                                result.originalFunctor = path as NodePath<t.Function>;
                                transpileIfFunctorAndCallCollected(path);
                            }
                        },

                        CallExpression(path: NodePath<t.CallExpression>) {
                            if (path.getPathLocation() === callPath) {
                                path.assertCallExpression();
                                result.callExpression = path as NodePath<t.CallExpression>;
                                transpileIfFunctorAndCallCollected(path);
                            }
                        }
                    }
                }
            ]
        });

        if (!result.callExpression) {
            throw new Error(`Call Expression with path ${callPath} not found.`);
        }

        if (!result.originalFunctor) {
            throw new Error(`Functor with full path ${fullFunctorPath} not found.`);
        }

        return {
            ast: transformResult.ast!,
            callExpression: result.callExpression!,
            code: transformResult.code!,
            environmentVariables: result.environmentVariables!,
            originalFunctor: result.originalFunctor!,
            transpiledFunctor: result.transpiledFunctor!
        };
    }
});
