import {use as chaiUse, expect} from "chai";
import * as sinon from "sinon";
import * as sinonChai from "sinon-chai";

import {transform} from "babel-core";
import * as t from "babel-types";
import {NodePath} from "babel-traverse";
import * as util from "../../src/util";
import {PARALLEL_ES_MODULE_NAME} from "../../src/constants";
import {ModuleFunctionsRegistry} from "../../src/function-extractor/module-functions-registry";
import {StatefulParallelFunctorsExtractorVisitor} from "../../src/function-extractor/stateful-parallel-functors-extractor-visitor";
chaiUse(sinonChai);

describe("StatefulParallelFunctorsExtractorVisitor", function () {
    let moduleFunctionRegistry: ModuleFunctionsRegistry;
    let registerFunctionSpy: sinon.SinonStub;
    let warnSpy: sinon.SinonSpy;

    beforeEach(function () {
        moduleFunctionRegistry = new ModuleFunctionsRegistry("test.js");
        registerFunctionSpy = sinon.stub(moduleFunctionRegistry, "registerFunction");
        registerFunctionSpy.returns({
            identifier: "static-id",
            node: undefined
        });
        warnSpy = sinon.spy(util, "warn");
    });

    afterEach(function () {
         registerFunctionSpy.restore();
         warnSpy.restore();
    });

    describe("Imports", function () {
        describe("Default Import", function () {
            it("sets 'parallel:instance' to true for the bindings path of the default import parallel", function () {
                const program = visit(`import parallel from "${PARALLEL_ES_MODULE_NAME}";`);

                const binding = program.scope.getBinding("parallel");
                expect(binding.path.getData("parallel:instance")).to.be.true;
            });

            it("sets 'parallel:instance' of the default parallel import path to true even if not named parallel", function () {
                const program = visit(`import par from "${PARALLEL_ES_MODULE_NAME}";`);

                const parallel = program.scope.getBinding("par");
                expect(parallel.path.getData("parallel:instance")).to.be.true;
            });

            it("does not set 'parallel:instance' to true for a default import of another moduel", function () {
                const program = visit(`import parallel from "other";`);

                expect(program.scope.getBinding("parallel").path.getData("parallel:instance")).to.be.undefined;
            });
        });

        describe("Named Default Import", function () {
            it("sets 'parallel:instance' to true for the path of the binding for a named default import", function () {
                const program = visit(`import {default as par} from "${PARALLEL_ES_MODULE_NAME}";`);

                const parallelBinding = program.scope.getBinding("par");
                expect(parallelBinding.path.getData("parallel:instance")).to.be.true;
            });

            it("doe snot set 'parallel:instance' to true if it is another named import", function () {
                const program = visit(`import {IParallel} from "${PARALLEL_ES_MODULE_NAME}";`);

                const binding = program.scope.getBinding("IParallel");
                expect(binding.path.getData("parallel:instance")).to.be.undefined;
            });

            it("does not set the identifier if another module is imported", function () {
                const program = visit(`import {default as test} from "other";`);

                const binding = program.scope.getBinding("test");
                expect(binding.path.getData("parallel:instance")).to.be.undefined;
            });
        });

        describe("CommonJS", function () {
            it("sets 'parallel:instance' to true for the binding of a variable bound to require('parallel-es')", function () {
                const program = visit(`const parallel = require("${PARALLEL_ES_MODULE_NAME}");`);

                const binding = program.scope.getBinding("parallel");
                expect(binding.path.getData("parallel:instance")).to.be.true;
            });

            it("does not set 'parallel.instance' another module is required", function () {
                const program = visit(`const parallel = require("par");`);

                const binding = program.scope.getBinding("parallel");
                expect(binding.path.getData("parallel:instance")).to.be.undefined;
            });

            it("does not set 'paralle.instance' if it is a constant variable", function () {
                const program = visit(`const parallel = true;`);

                const binding = program.scope.getBinding("parallel");
                expect(binding.path.getData("parallel:instance")).to.be.undefined;
            });
        });
    });

    describe("Method Registration", function () {
        describe("map", function () {
            it("registers the mapper", function () {
                const program = visit(`
                import parallel from "${PARALLEL_ES_MODULE_NAME}";
                parallel.from([1, 2, 3]).map(value => value * 2);
                `);

                const mapper = program.get("body.1.expression.arguments.0");
                expect(registerFunctionSpy).to.have.been.calledWith(mapper);
            });

            it("replaces the mapper arrow expression with the function id", function () {
                registerFunctionSpy.returnValue = {
                    identifier: "unique-id",
                    node: undefined as any
                };

                const program = visit(`
                import parallel from "${PARALLEL_ES_MODULE_NAME}";
                parallel.from([1, 2, 3]).map(value => value * 2);
                `);

                const mapper = program.get("body.1.expression.arguments.0");
                expect(mapper.isObjectExpression()).to.be.true;

                const functionId = mapper.node as t.ObjectExpression;
                expect(functionId.properties).to.have.lengthOf(2);
                expect(functionId.properties).to.have.deep.property("[0].key.name", "identifier");
                expect(functionId.properties).to.have.deep.property("[0].value.value", "static-id");
                expect(functionId.properties).to.have.deep.property("[1].key.name", "_______isFunctionId");
                expect(functionId.properties).to.have.deep.property("[1].value.value", true);
            });

            it("replaces the mapper function expression with the function id", function () {
                registerFunctionSpy.returnValue = {
                    identifier: "unique-id",
                    node: undefined as any
                };

                const program = visit(`
                import parallel from "${PARALLEL_ES_MODULE_NAME}";
                parallel.from([1, 2, 3]).map(function (value) { return value * 2; });
                `);

                const mapper = program.get("body.1.expression.arguments.0");
                expect(mapper.isObjectExpression()).to.be.true;

                const functionId = mapper.node as t.ObjectExpression;
                expect(functionId.properties).to.have.lengthOf(2);
                expect(functionId.properties).to.have.deep.property("[0].key.name", "identifier");
                expect(functionId.properties).to.have.deep.property("[0].value.value", "static-id");
                expect(functionId.properties).to.have.deep.property("[1].key.name", "_______isFunctionId");
                expect(functionId.properties).to.have.deep.property("[1].value.value", true);
            });

            it("replaces the function reference with the function id", function () {
                registerFunctionSpy.returnValue = {
                    identifier: "unique-id",
                    node: undefined as any
                };

                const program = visit(`
                import parallel from "${PARALLEL_ES_MODULE_NAME}";
                function duplicate(value) {
                    return value + value;
                }
                
                parallel.from([1, 2, 3]).map(duplicate);
                `);

                const mapper = program.get("body.2.expression.arguments.0");
                expect(mapper.isObjectExpression()).to.be.true;

                const functionId = mapper.node as t.ObjectExpression;
                expect(functionId.properties).to.have.lengthOf(2);
                expect(functionId.properties).to.have.deep.property("[0].key.name", "identifier");
                expect(functionId.properties).to.have.deep.property("[0].value.value", "static-id");
                expect(functionId.properties).to.have.deep.property("[1].key.name", "_______isFunctionId");
                expect(functionId.properties).to.have.deep.property("[1].value.value", true);
            });

            it("registers the function referenced by the identifier", function () {
                registerFunctionSpy.returnValue = {
                    identifier: "unique-id",
                    node: undefined as any
                };

                const program = visit(`
                import parallel from "${PARALLEL_ES_MODULE_NAME}";
                const duplicate = value => value + value;
                
                parallel.from([1, 2, 3]).map(duplicate);
                `);

                const mapper = program.get("body.1.declarations.0.init");
                expect(registerFunctionSpy).to.have.been.calledWith(mapper);
            });

            it("supports aliasing", function () {
                registerFunctionSpy.returnValue = {
                    identifier: "unique-id",
                    node: undefined as any
                };

                const program = visit(`
                import parallel from "${PARALLEL_ES_MODULE_NAME}";
                const duplicate = value => value + value;
                const twice = duplicate;
                
                parallel.from([1, 2, 3]).map(twice);
                `);

                const mapper = program.get("body.1.declarations.0.init");
                expect(registerFunctionSpy).to.have.been.calledWith(mapper);
            });

            it("logs a warning if the declaration of the passed functor cannot be identified", function () {
                registerFunctionSpy.returnValue = {
                    identifier: "unique-id",
                    node: undefined as any
                };

                const program = visit(`
                import parallel from "${PARALLEL_ES_MODULE_NAME}";
                
                function compute(operation) {
                    return parallel.from([1, 2, 3]).map(operation);
                }
                
                compute(() => value * 2);
                `);

                const mapper = program.get("body.1.body.body.0.argument.arguments.0");
                expect(registerFunctionSpy).not.to.have.been.called;
                expect(warnSpy).to.have.been.calledWith(mapper, "The function identified by the given node could not be identified. Static code rewriting of the function is therefore not possible, dynamic function dispatching is used instead.");
            });

            it("throws an error if the functor is not a function", function () {
                expect(() => {
                    visit(`
                    import parallel from "${PARALLEL_ES_MODULE_NAME}";
                    parallel.from([1, 2, 3]).map({ test: true });
                    `);
                }).to.throw("test.js: The node passed as functor is neither a serialized function nor a reference to a function. Invalid use of the api.");
            });

            it("does not register the functor if it is a serialized function id", function () {
                visit(`
                import parallel from "${PARALLEL_ES_MODULE_NAME}";
                
                parallel.from([1, 2, 3]).map({ _______isFunctionId: true, identifier: 'test' });
                `);

                expect(registerFunctionSpy).not.to.have.been.called;
            });
        });

        describe("filter", function () {
            it("registers the predicate", function () {
                const program = visit(`
                import parallel from "${PARALLEL_ES_MODULE_NAME}";
                parallel.from([1, 2, 3]).filter(value => value % 2 === 0);
                `);

                const predicate = program.get("body.1.expression.arguments.0");
                expect(registerFunctionSpy).to.have.been.calledWith(predicate);
            });
        });

        describe("reduce", function () {
            it("registers the accumulator", function () {
                const program = visit(`
                import parallel from "${PARALLEL_ES_MODULE_NAME}";
                parallel.from([1, 2, 3]).reduce(0, (memo, value) => memo + value);
                `);

                const accumulator = program.get("body.1.expression.arguments.1");
                expect(registerFunctionSpy).to.have.been.calledWith(accumulator);
            });

            it("adds the accumulator as combiner if reduce is only called with two arguments", function () {
                const program = visit(`
                import parallel from "${PARALLEL_ES_MODULE_NAME}";
                parallel.from([1, 2, 3]).reduce(0, (memo, value) => memo + value);
                `);

                const args = (program.get("body.1.expression.arguments") as any) as NodePath<t.Node>[];
                expect(args).to.have.length(3);
                expect(args[2].isArrowFunctionExpression()).to.be.true;
            });

            it("does not add the combiner if reduce is called with three arguments", function () {
                const program = visit(`
                import parallel from "${PARALLEL_ES_MODULE_NAME}";
                let combiner = (memo, value) => value + memo;
                parallel.from([1, 2, 3]).reduce(0, (memo, value) => memo + value, combiner);
                `);

                const accumulator = program.get("body.2.expression.arguments.2");
                expect(accumulator.isIdentifier()).to.be.true;
            });
        });

        describe("inEnvironment", function () {
            it("registers the provider function", function () {
                const program = visit(`
                import parallel from "${PARALLEL_ES_MODULE_NAME}";
                parallel.times(100, i => i**i).inEnvironment(() => ({ test: true }));
                `);

                const generator = program.get("body.1.expression.arguments.0");
                expect(registerFunctionSpy).to.have.been.calledWith(generator);
            });

            it("replaces the provider function with a serialized function call", function () {
                const program = visit(`
                import parallel from "${PARALLEL_ES_MODULE_NAME}";
                parallel.times(100, i => i**i).inEnvironment((arg1, arg2) => ({ test: true }), 10, 20);
                `);

                const inEnvironmentCall = program.get("body.1.expression") as NodePath<t.CallExpression>;
                const generator = inEnvironmentCall.get("arguments.0");

                expect(inEnvironmentCall.node.arguments).to.have.lengthOf(1);
                expect(generator.isObjectExpression()).to.be.true;

                const properties = (generator as NodePath<t.ObjectExpression>).node.properties;
                expect(properties[0]).to.have.deep.property("key.name").that.equals("functionId");
                expect(properties[0]).to.have.deep.property("value.properties[0].key.name").that.equals("identifier");
                expect(properties[0]).to.have.deep.property("value.properties[0].value.value").that.equals("static-id");
                expect(properties[0]).to.have.deep.property("value.properties[1].key.name").that.equals("_______isFunctionId");
                expect(properties[0]).to.have.deep.property("value.properties[1].value.value").that.is.true;

                expect(properties[1]).to.have.deep.property("key.name").that.equals("parameters");
                expect(properties[1]).to.have.deep.property("value.elements[0].value").that.equals(10);
                expect(properties[1]).to.have.deep.property("value.elements[1].value").that.equals(20);

                expect(properties[2]).to.have.deep.property("key.name").that.equals("______serializedFunctionCall");
                expect(properties[2]).to.have.deep.property("value.value").that.is.true;

            });

            it("also allows passing non functions instead of the functor", function () {
                const program = visit(`
                import parallel from "${PARALLEL_ES_MODULE_NAME}";
                parallel.times(100, "start value").inEnvironment({ test: true });
                `);

                const environment = program.get("body.1.expression.arguments.0") as NodePath<t.ObjectExpression>;
                expect(registerFunctionSpy).not.to.have.been.called;
                expect(environment.node.properties[0]).to.have.deep.property("key.name").that.equals("test");
            });
        });

        describe("times", function () {
            it("registers the generator function", function () {
                const program = visit(`
                import parallel from "${PARALLEL_ES_MODULE_NAME}";
                parallel.times(100, i => i**i);
                `);

                const generator = program.get("body.1.expression.arguments.1");
                expect(registerFunctionSpy).to.have.been.calledWith(generator);
            });

            it("also allows passing non functions instead of the functor", function () {
                visit(`
                import parallel from "${PARALLEL_ES_MODULE_NAME}";
                parallel.times(100, "start value");
                `);

                expect(registerFunctionSpy).not.to.have.been.called;
            });
        });

        describe("schedule", function () {
            it("registers the scheduled function", function () {
                const program = visit(`
                import parallel from "${PARALLEL_ES_MODULE_NAME}";
                parallel.schedule(() => {
                    for (let i = 0; i < 1000; ++i) {
                        // heavy computation
                    }
                });
                `);

                const func = program.get("body.1.expression.arguments.0");
                expect(registerFunctionSpy).to.have.been.calledWith(func);
            });

            it("replaces the function call with a serialized function call", function () {
                const program = visit(`
                import parallel from "${PARALLEL_ES_MODULE_NAME}";
                parallel.schedule((arg1, arg2) => ({ test: true }), 10, 20);
                `);

                const scheduleCall = program.get("body.1.expression") as NodePath<t.CallExpression>;
                const functor = scheduleCall.get("arguments.0");

                expect(scheduleCall.node.arguments).to.have.lengthOf(1);
                expect(functor.isObjectExpression()).to.be.true;

                const properties = (functor as NodePath<t.ObjectExpression>).node.properties;
                expect(properties[0]).to.have.deep.property("key.name").that.equals("functionId");
                expect(properties[0]).to.have.deep.property("value.properties[0].key.name").that.equals("identifier");
                expect(properties[0]).to.have.deep.property("value.properties[0].value.value").that.equals("static-id");
                expect(properties[0]).to.have.deep.property("value.properties[1].key.name").that.equals("_______isFunctionId");
                expect(properties[0]).to.have.deep.property("value.properties[1].value.value").that.is.true;

                expect(properties[1]).to.have.deep.property("key.name").that.equals("parameters");
                expect(properties[1]).to.have.deep.property("value.elements[0].value").that.equals(10);
                expect(properties[1]).to.have.deep.property("value.elements[1].value").that.equals(20);

                expect(properties[2]).to.have.deep.property("key.name").that.equals("______serializedFunctionCall");
                expect(properties[2]).to.have.deep.property("value.value").that.is.true;
            });
        });

        describe("not parallel", function () {
            it("does not register functors passed to not parallel methods", function () {
                visit(`
                import parallel from "parallel2";
                parallel.schedule(() => {
                    for (let i = 0; i < 1000; ++i) {
                        // heavy computation
                    }
                });
                `);

                expect(registerFunctionSpy).not.to.have.been.called;
            });
        });
    });

    function visit(code: string): NodePath<t.Program> {
        let programPath: NodePath<t.Program> | undefined;
        transform(code, {
            filename: "test.js",
            plugins: [
                {
                    visitor: {
                        Program(path: NodePath<t.Program>) {
                            programPath = path;
                            path.traverse(StatefulParallelFunctorsExtractorVisitor, moduleFunctionRegistry);
                        }
                    }
                }
            ]
        });

        return programPath!;
    }
});
