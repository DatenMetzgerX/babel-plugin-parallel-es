import { use as chaiUse, expect } from "chai";
import * as sinon from "sinon";
import * as sinonChai from "sinon-chai";

import { parse } from "babylon";
import { transformFromAst } from "babel-core";
import * as t from "babel-types";
import { NodePath, Scope } from "babel-traverse";
import * as util from "../../src/util";
import { PARALLEL_ES_MODULE_NAME } from "../../src/constants";
import { ModuleFunctionsRegistry } from "../../src/module-functions-registry";
import { StatefulParallelFunctorsExtractorVisitor } from "../../src/function-extractor/stateful-parallel-functors-extractor-visitor";
chaiUse(sinonChai);

describe("StatefulParallelFunctorsExtractorVisitor", function() {
  let moduleFunctionRegistry: ModuleFunctionsRegistry;
  let registerFunctionSpy: sinon.SinonStub;
  let registerEntryFunctionSpy: sinon.SinonStub;
  let scope: Scope;
  let hasBindingStub: sinon.SinonStub;
  let warnSpy: sinon.SinonSpy;

  beforeEach(function() {
    hasBindingStub = sinon.stub();
    scope = { hasBinding: hasBindingStub } as any;
    moduleFunctionRegistry = new ModuleFunctionsRegistry("test.js", scope);
    registerFunctionSpy = sinon.stub(moduleFunctionRegistry, "registerFunction");
    registerEntryFunctionSpy = sinon.stub(moduleFunctionRegistry, "registerEntryFunction");
    registerEntryFunctionSpy.returns({
      functionId: "static-id",
      node: undefined
    });
    warnSpy = sinon.spy(util, "warn");
  });

  afterEach(function() {
    hasBindingStub.reset();
    registerFunctionSpy.restore();
    registerEntryFunctionSpy.restore();
    warnSpy.restore();
  });

  describe("Imports", function() {
    describe("Default Import", function() {
      it("sets 'parallel:instance' to true for the bindings path of the default import parallel", function() {
        const { transpiled } = visit(`import parallel from "${PARALLEL_ES_MODULE_NAME}";`);

        const binding = transpiled.scope.getBinding("parallel");

        // tslint:disable-next-line:no-unused-expression
        expect(binding.path.getData("parallel:instance")).to.be.true;
      });

      it("sets 'parallel:instance' of the default parallel import path to true even if not named parallel", function() {
        const { transpiled } = visit(`import par from "${PARALLEL_ES_MODULE_NAME}";`);

        const parallel = transpiled.scope.getBinding("par");

        // tslint:disable-next-line:no-unused-expression
        expect(parallel.path.getData("parallel:instance")).to.be.true;
      });

      it("does not set 'parallel:instance' to true for a default import of another moduel", function() {
        const { transpiled } = visit(`import parallel from "other";`);

        // tslint:disable-next-line:no-unused-expression
        expect(transpiled.scope.getBinding("parallel").path.getData("parallel:instance")).to.be.undefined;
      });
    });

    describe("Named Default Import", function() {
      it("sets 'parallel:instance' to true for the path of the binding for a named default import", function() {
        const { transpiled } = visit(`import {default as par} from "${PARALLEL_ES_MODULE_NAME}";`);

        const parallelBinding = transpiled.scope.getBinding("par");
        // tslint:disable-next-line:no-unused-expression
        expect(parallelBinding.path.getData("parallel:instance")).to.be.true;
      });

      it("doe snot set 'parallel:instance' to true if it is another named import", function() {
        const { transpiled } = visit(`import {IParallel} from "${PARALLEL_ES_MODULE_NAME}";`);

        const binding = transpiled.scope.getBinding("IParallel");
        // tslint:disable-next-line:no-unused-expression
        expect(binding.path.getData("parallel:instance")).to.be.undefined;
      });

      it("does not set the identifier if another module is imported", function() {
        const { transpiled } = visit(`import {default as test} from "other";`);

        const binding = transpiled.scope.getBinding("test");
        // tslint:disable-next-line:no-unused-expression
        expect(binding.path.getData("parallel:instance")).to.be.undefined;
      });
    });

    describe("CommonJS", function() {
      it("sets 'parallel:instance' to true for the binding of a variable bound to require('parallel-es')", function() {
        const { transpiled } = visit(`const parallel = require("${PARALLEL_ES_MODULE_NAME}");`);

        const binding = transpiled.scope.getBinding("parallel");
        // tslint:disable-next-line:no-unused-expression
        expect(binding.path.getData("parallel:instance")).to.be.true;
      });

      it("does not set 'parallel.instance' another module is required", function() {
        const { transpiled } = visit(`const parallel = require("par");`);

        const binding = transpiled.scope.getBinding("parallel");
        // tslint:disable-next-line:no-unused-expression
        expect(binding.path.getData("parallel:instance")).to.be.undefined;
      });

      it("does not set 'paralle.instance' if it is a constant variable", function() {
        const { transpiled } = visit(`const parallel = true;`);

        const binding = transpiled.scope.getBinding("parallel");
        // tslint:disable-next-line:no-unused-expression
        expect(binding.path.getData("parallel:instance")).to.be.undefined;
      });
    });
  });

  describe("Method Registration", function() {
    describe("map", function() {
      it("registers the mapper", function() {
        const { original } = visit(`
                import parallel from "${PARALLEL_ES_MODULE_NAME}";
                function mapper (value) { return value * 2; }
                parallel.from([1, 2, 3]).map(mapper);
                `);

        const mapper = original.program.body[1];
        expect(registerEntryFunctionSpy).to.have.been.calledWithMatch(mapper);
      });

      it("replaces the mapper arrow expression with the function id", function() {
        const { transpiled } = visit(`
                import parallel from "${PARALLEL_ES_MODULE_NAME}";
                parallel.from([1, 2, 3]).map(value => value * 2);
                `);

        const mapper = transpiled.get("body.1.expression.arguments.0");
        // tslint:disable-next-line:no-unused-expression
        expect(mapper.isObjectExpression()).to.be.true;

        const functionId = mapper.node as t.ObjectExpression;
        expect(functionId.properties).to.have.lengthOf(2);
        expect(functionId.properties).to.have.deep.property("[0].key.name", "identifier");
        expect(functionId.properties).to.have.deep.property("[0].value.value", "static-id");
        expect(functionId.properties).to.have.deep.property("[1].key.name", "_______isFunctionId");
        expect(functionId.properties).to.have.deep.property("[1].value.value", true);
      });

      it("replaces the mapper function expression with the function id", function() {
        const { transpiled } = visit(`
                import parallel from "${PARALLEL_ES_MODULE_NAME}";
                parallel.from([1, 2, 3]).map(function (value) { return value * 2; });
                `);

        const mapper = transpiled.get("body.1.expression.arguments.0");
        // tslint:disable-next-line:no-unused-expression
        expect(mapper.isObjectExpression()).to.be.true;

        const functionId = mapper.node as t.ObjectExpression;
        expect(functionId.properties).to.have.lengthOf(2);
        expect(functionId.properties).to.have.deep.property("[0].key.name", "identifier");
        expect(functionId.properties).to.have.deep.property("[0].value.value", "static-id");
        expect(functionId.properties).to.have.deep.property("[1].key.name", "_______isFunctionId");
        expect(functionId.properties).to.have.deep.property("[1].value.value", true);
      });

      it("replaces the function reference with the function id", function() {
        const { transpiled } = visit(`
                import parallel from "${PARALLEL_ES_MODULE_NAME}";
                function duplicate(value) {
                    return value + value;
                }

                parallel.from([1, 2, 3]).map(duplicate);
                `);

        const mapper = transpiled.get("body.2.expression.arguments.0");
        // tslint:disable-next-line:no-unused-expression
        expect(mapper.isObjectExpression()).to.be.true;

        const functionId = mapper.node as t.ObjectExpression;
        expect(functionId.properties).to.have.lengthOf(2);
        expect(functionId.properties).to.have.deep.property("[0].key.name", "identifier");
        expect(functionId.properties).to.have.deep.property("[0].value.value", "static-id");
        expect(functionId.properties).to.have.deep.property("[1].key.name", "_______isFunctionId");
        expect(functionId.properties).to.have.deep.property("[1].value.value", true);
      });

      it("transforms the function expression to a function declaration", function() {
        const { original } = visit(`
                import parallel from "${PARALLEL_ES_MODULE_NAME}";

                parallel.from([1, 2, 3]).map(function mapper (value) { return value + value; });`);

        const mapper = original.program.body[1].expression.arguments[0] as t.FunctionExpression;
        expect(registerEntryFunctionSpy).to.have.been.calledWithMatch({
          async: false,
          body: mapper.body,
          generator: false,
          id: t.identifier("mapper"),
          params: mapper.params,
          type: "FunctionDeclaration"
        });
      });

      it("transforms the arrow function expression to a function declaration", function() {
        const { original } = visit(`
                import parallel from "${PARALLEL_ES_MODULE_NAME}";

                parallel.from([1, 2, 3]).map(value => value + value);`);

        const mapper = original.program.body[1].expression.arguments[0] as t.ArrowFunctionExpression;
        expect(registerEntryFunctionSpy).to.have.been.calledWithMatch({
          async: false,
          body: sinon.match.defined,
          generator: false,
          id: t.identifier("_anonymous"),
          params: mapper.params,
          type: "FunctionDeclaration"
        });

        // tslint:disable-next-line:no-unused-expression
        expect(registerEntryFunctionSpy.args[0][0]).to.have.property("body").that.is.not.undefined;
      });

      it("supports aliasing", function() {
        const { original } = visit(`
                import parallel from "${PARALLEL_ES_MODULE_NAME}";
                function duplicate(value) { return value + value; }
                const twice = duplicate;

                parallel.from([1, 2, 3]).map(twice);
                `);

        const mapper = original.program.body[1];
        expect(registerEntryFunctionSpy).to.have.been.calledWith(mapper);
      });

      it("logs a warning if the declaration of the passed functor cannot be identified", function() {
        const { transpiled } = visit(`
                import parallel from "${PARALLEL_ES_MODULE_NAME}";

                function compute(operation) {
                    return parallel.from([1, 2, 3]).map(operation);
                }

                compute(() => value * 2);
                `);

        const mapper = transpiled.get("body.1.body.body.0.argument.arguments.0");
        // tslint:disable-next-line:no-unused-expression
        expect(registerEntryFunctionSpy).not.to.have.been.called;
        expect(warnSpy).to.have.been.calledWith(
          mapper,
          "The function identified by the given node could not be identified. Static code rewriting of the function is therefore not possible, dynamic function dispatching is used instead."
        );
      });

      it("throws an error if the functor is not a function", function() {
        expect(() => {
          visit(`
                    import parallel from "${PARALLEL_ES_MODULE_NAME}";
                    parallel.from([1, 2, 3]).map({ test: true });
                    `);
        }).to.throw(
          "test.js: The node passed as functor is neither a serialized function nor a reference to a function. Invalid use of the api."
        );
      });

      it("does not register the functor if it is a serialized function id", function() {
        visit(`
                import parallel from "${PARALLEL_ES_MODULE_NAME}";

                parallel.from([1, 2, 3]).map({ _______isFunctionId: true, identifier: 'test' });
                `);

        // tslint:disable-next-line:no-unused-expression
        expect(registerEntryFunctionSpy).not.to.have.been.called;
      });
    });

    describe("filter", function() {
      it("registers the predicate", function() {
        const { original } = visit(`
                import parallel from "${PARALLEL_ES_MODULE_NAME}";
                function predicate (value) {
                    return value % 2 === 0;
                }
                
                parallel.from([1, 2, 3]).filter(predicate);
                `);

        const predicate = original.program.body[1];
        expect(registerEntryFunctionSpy).to.have.been.calledWith(predicate);
      });
    });

    describe("reduce", function() {
      it("registers the accumulator", function() {
        const { original } = visit(`
                import parallel from "${PARALLEL_ES_MODULE_NAME}";
                function accumulator (memo, value) {
                    return memo + value;
                }
                parallel.from([1, 2, 3]).reduce(0, accumulator);
                `);

        const accumulator = original.program.body[1];
        expect(registerEntryFunctionSpy).to.have.been.calledWith(accumulator);
      });

      it("adds the accumulator as combiner if reduce is only called with two arguments", function() {
        const { transpiled } = visit(`
                import parallel from "${PARALLEL_ES_MODULE_NAME}";
                function accumulator (memo, value) {
                    return memo + value;
                }
                parallel.from([1, 2, 3]).reduce(0, accumulator);
                `);

        const args = (transpiled.get("body.2.expression.arguments") as any) as NodePath<t.Node>[];
        expect(args).to.have.length(3);
        expect(args[2].node)
          .to.have.property("name")
          .that.equals("accumulator");
      });

      it("does not add the combiner if reduce is called with three arguments", function() {
        const { transpiled } = visit(`
                import parallel from "${PARALLEL_ES_MODULE_NAME}";
                let combiner = (memo, value) => value + memo;
                parallel.from([1, 2, 3]).reduce(0, (memo, value) => memo + value, combiner);
                `);

        const accumulator = transpiled.get("body.2.expression.arguments.2");
        // tslint:disable-next-line:no-unused-expression
        expect(accumulator.isIdentifier()).to.be.true;
        expect(accumulator.node)
          .to.have.property("name")
          .that.equals("combiner");
      });
    });

    describe("inEnvironment", function() {
      it("registers the provider function", function() {
        const { original } = visit(`
                import parallel from "${PARALLEL_ES_MODULE_NAME}";
                function environmentProvider() {
                    return { test: true };
                }
                parallel.times(100, i => i**i).inEnvironment(environmentProvider);
                `);

        const generator = original.program.body[1];
        expect(registerEntryFunctionSpy).to.have.been.calledWith(generator);
      });

      it("replaces the provider function with a serialized function call", function() {
        const { transpiled } = visit(`
                import parallel from "${PARALLEL_ES_MODULE_NAME}";
                parallel.times(100, i => i**i).inEnvironment((arg1, arg2) => ({ test: true }), 10, 20);
                `);

        const inEnvironmentCall = transpiled.get("body.1.expression") as NodePath<t.CallExpression>;
        const generator = inEnvironmentCall.get("arguments.0");

        expect(inEnvironmentCall.node.arguments).to.have.lengthOf(1);
        // tslint:disable-next-line:no-unused-expression
        expect(generator.isObjectExpression()).to.be.true;

        const properties = (generator as NodePath<t.ObjectExpression>).node.properties;
        expect(properties[0])
          .to.have.deep.property("key.name")
          .that.equals("functionId");
        expect(properties[0])
          .to.have.deep.property("value.properties[0].key.name")
          .that.equals("identifier");
        expect(properties[0])
          .to.have.deep.property("value.properties[0].value.value")
          .that.equals("static-id");
        expect(properties[0])
          .to.have.deep.property("value.properties[1].key.name")
          .that.equals("_______isFunctionId");
        // tslint:disable-next-line:no-unused-expression
        expect(properties[0]).to.have.deep.property("value.properties[1].value.value").that.is.true;

        expect(properties[1])
          .to.have.deep.property("key.name")
          .that.equals("parameters");
        expect(properties[1])
          .to.have.deep.property("value.elements[0].value")
          .that.equals(10);
        expect(properties[1])
          .to.have.deep.property("value.elements[1].value")
          .that.equals(20);

        expect(properties[2])
          .to.have.deep.property("key.name")
          .that.equals("______serializedFunctionCall");
        // tslint:disable-next-line:no-unused-expression
        expect(properties[2]).to.have.deep.property("value.value").that.is.true;
      });

      it("also allows passing non functions instead of the functor", function() {
        const { transpiled } = visit(`
                import parallel from "${PARALLEL_ES_MODULE_NAME}";
                parallel.times(100, "start value").inEnvironment({ test: true });
                `);

        const environment = transpiled.get("body.1.expression.arguments.0") as NodePath<t.ObjectExpression>;
        // tslint:disable-next-line:no-unused-expression
        expect(registerEntryFunctionSpy).not.to.have.been.called;
        expect(environment.node.properties[0])
          .to.have.deep.property("key.name")
          .that.equals("test");
      });
    });

    describe("times", function() {
      it("registers the generator function", function() {
        const { original } = visit(`
                import parallel from "${PARALLEL_ES_MODULE_NAME}";
                function generator(i) {
                    return i * i;
                }
                parallel.times(100, generator);
                `);

        const generator = original.program.body[1];
        expect(registerEntryFunctionSpy).to.have.been.calledWith(generator);
      });

      it("also allows passing non functions instead of the functor", function() {
        visit(`
                import parallel from "${PARALLEL_ES_MODULE_NAME}";
                parallel.times(100, "start value");
                `);

        // tslint:disable-next-line:no-unused-expression
        expect(registerEntryFunctionSpy).not.to.have.been.called;
      });
    });

    describe("schedule", function() {
      it("registers the scheduled function", function() {
        const { original } = visit(`
                import parallel from "${PARALLEL_ES_MODULE_NAME}";
                function job() {
                    for (let i = 0; i < 1000; ++i) {
                        // heavy computation
                    }
                }
                parallel.schedule(job);
                `);

        const func = original.program.body[1];
        expect(registerEntryFunctionSpy).to.have.been.calledWith(func);
      });

      it("replaces the function call with a serialized function call", function() {
        const { transpiled } = visit(`
                import parallel from "${PARALLEL_ES_MODULE_NAME}";
                parallel.schedule((arg1, arg2) => ({ test: true }), 10, 20);
                `);

        const scheduleCall = transpiled.get("body.1.expression") as NodePath<t.CallExpression>;
        const functor = scheduleCall.get("arguments.0");

        expect(scheduleCall.node.arguments).to.have.lengthOf(1);
        // tslint:disable-next-line:no-unused-expression
        expect(functor.isObjectExpression()).to.be.true;

        const properties = (functor as NodePath<t.ObjectExpression>).node.properties;
        expect(properties[0])
          .to.have.deep.property("key.name")
          .that.equals("functionId");
        expect(properties[0])
          .to.have.deep.property("value.properties[0].key.name")
          .that.equals("identifier");
        expect(properties[0])
          .to.have.deep.property("value.properties[0].value.value")
          .that.equals("static-id");
        expect(properties[0])
          .to.have.deep.property("value.properties[1].key.name")
          .that.equals("_______isFunctionId");
        // tslint:disable-next-line:no-unused-expression
        expect(properties[0]).to.have.deep.property("value.properties[1].value.value").that.is.true;

        expect(properties[1])
          .to.have.deep.property("key.name")
          .that.equals("parameters");
        expect(properties[1])
          .to.have.deep.property("value.elements[0].value")
          .that.equals(10);
        expect(properties[1])
          .to.have.deep.property("value.elements[1].value")
          .that.equals(20);

        expect(properties[2])
          .to.have.deep.property("key.name")
          .that.equals("______serializedFunctionCall");
        // tslint:disable-next-line:no-unused-expression
        expect(properties[2]).to.have.deep.property("value.value").that.is.true;
      });
    });

    describe("not parallel", function() {
      it("does not register functors passed to not parallel methods", function() {
        visit(`
                import parallel from "parallel2";
                parallel.schedule(() => {
                    for (let i = 0; i < 1000; ++i) {
                        // heavy computation
                    }
                });
                `);

        // tslint:disable-next-line:no-unused-expression
        expect(registerEntryFunctionSpy).not.to.have.been.called;
      });
    });
  });

  function visit(code: string) {
    let programPath: NodePath<t.Program> | undefined;
    const ast = parse(code, { sourceType: "module" });
    transformFromAst((t as any).cloneDeep(ast), code, {
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

    return {
      original: ast as any,
      transpiled: programPath!
    };
  }
});
