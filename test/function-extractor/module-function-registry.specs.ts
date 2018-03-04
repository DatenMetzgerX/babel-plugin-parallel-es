import { expect } from "chai";
import * as t from "babel-types";
import * as sinon from "sinon";
import { ModuleFunctionsRegistry } from "../../src/module-functions-registry";
import { Scope } from "babel-traverse";

describe("ModuleFunctionRegistry", function() {
  let registry: ModuleFunctionsRegistry;
  let scope: Scope;
  let hasBindingSpy: sinon.SinonStub;
  let generateUidIdentifierBasedOnNodeSpy: sinon.SinonStub;

  beforeEach(function() {
    hasBindingSpy = sinon.stub().returns(true);
    generateUidIdentifierBasedOnNodeSpy = sinon.stub();
    scope = { generateUidIdentifierBasedOnNode: generateUidIdentifierBasedOnNodeSpy, hasBinding: hasBindingSpy } as any;
    registry = new ModuleFunctionsRegistry("test.js", scope);
  });

  it("has the module name passed in the constructor", function() {
    // assert
    expect(registry.fileName).to.equal("test.js");
  });

  it("has no source map by default", function() {
    // assert
    // tslint:disable-next-line:no-unused-expression
    expect(registry.map).to.undefined;
  });

  it("has the source map passed in the constructor", function() {
    // arrange
    const sourceMap = {} as any;

    // act
    registry = new ModuleFunctionsRegistry("test.js", scope, sourceMap);

    // assert
    expect(registry.map).to.equal(sourceMap);
  });

  describe("functions", function() {
    it("returns an empty array by default", function() {
      expect(registry.functions).to.eql([]);
    });
  });

  describe("entryFunctions", function() {
    it("returns an empty array by default", function() {
      expect(registry.entryFunctions).to.eql([]);
    });
  });

  describe("environmentVariables", function() {
    it("returns an empty array by default", function() {
      expect(registry.environmentVariables).to.eql([]);
    });
  });

  describe("empty", function() {
    it("returns true by default", function() {
      // tslint:disable-next-line:no-unused-expression
      expect(registry.empty).to.be.true;
    });

    it("returns false if the registry contains a registration", function() {
      // arrange
      const declaration = t.functionDeclaration(
        t.identifier("func1"),
        [],
        t.blockStatement([t.expressionStatement(t.stringLiteral("test"))])
      );
      registry.registerFunction(declaration);

      // act, assert
      // tslint:disable-next-line:no-unused-expression
      expect(registry.empty).to.be.false;
    });
  });

  describe("registerFunction", function() {
    it("registers the given functions", function() {
      // arrange
      const func1 = t.functionDeclaration(
        t.identifier("func1"),
        [],
        t.blockStatement([t.expressionStatement(t.stringLiteral("test"))])
      );
      registry.registerFunction(func1);

      const func2 = t.functionDeclaration(
        t.identifier("func2"),
        [],
        t.blockStatement([t.expressionStatement(t.stringLiteral("test"))])
      );
      registry.registerFunction(func2);

      // act, assert
      expect(registry.functions).to.eql([func1, func2]);
    });

    it("registers a function only once when called multiple times", function() {
      // arrange
      const func1 = t.functionDeclaration(
        t.identifier("func1"),
        [],
        t.blockStatement([t.expressionStatement(t.stringLiteral("test"))])
      );
      registry.registerFunction(func1);

      // act
      registry.registerFunction(func1);

      // assert
      expect(registry.functions).to.eql([func1]);
    });

    it("returns the identifier of the registered function", function() {
      // arrange
      const func1 = t.functionDeclaration(
        t.identifier("func1"),
        [],
        t.blockStatement([t.expressionStatement(t.stringLiteral("test"))])
      );

      // act, assert
      expect(registry.registerFunction(func1)).to.equal(func1.id);
    });

    it("assigns the function a new unique id if the binding is not global (locally inside of a function)", function() {
      // arrange
      const uniqueName = t.identifier("_name");
      hasBindingSpy.returns(false);
      generateUidIdentifierBasedOnNodeSpy.returns(uniqueName);
      const func1 = t.functionDeclaration(
        t.identifier("func1"),
        [],
        t.blockStatement([t.expressionStatement(t.stringLiteral("test"))])
      );

      // act
      registry.registerFunction(func1);

      // assert
      expect(func1.id).to.equal(uniqueName);
    });

    it("returns the new generated id for a not globally bound function", function() {
      // arrange
      const uniqueName = t.identifier("_name");
      hasBindingSpy.returns(false);
      generateUidIdentifierBasedOnNodeSpy.returns(uniqueName);
      const func1 = t.functionDeclaration(
        t.identifier("func1"),
        [],
        t.blockStatement([t.expressionStatement(t.stringLiteral("test"))])
      );

      // act, assert
      expect(registry.registerFunction(func1)).to.equal(uniqueName);
    });

    it("throws if the passed node is not a Function-Declaration", function() {
      // arrange
      const statement = t.expressionStatement(t.stringLiteral("test"));

      // act, assert
      expect(() => registry.registerFunction(statement as any)).to.throw(
        `Expected type "FunctionDeclaration" with option {}`
      );
    });
  });

  describe("registerEntryFunction", function() {
    it("registers the function", function() {
      // arrange
      const func1 = t.functionDeclaration(
        t.identifier("func1"),
        [],
        t.blockStatement([t.expressionStatement(t.stringLiteral("test"))])
      );

      // act
      registry.registerEntryFunction(func1);

      // assert
      expect(registry.entryFunctions).to.eql([
        {
          functionId: "static:test.js/func1",
          identifier: func1.id,
          node: func1
        }
      ]);
    });

    it("registers the function only once", function() {
      // arrange
      const func1 = t.functionDeclaration(
        t.identifier("func1"),
        [],
        t.blockStatement([t.expressionStatement(t.stringLiteral("test"))])
      );

      // act
      registry.registerEntryFunction(func1);
      registry.registerEntryFunction(func1);

      // assert
      expect(registry.entryFunctions).to.eql([
        {
          functionId: "static:test.js/func1",
          identifier: func1.id,
          node: func1
        }
      ]);
    });

    it("adds a registration for an already registered, non entry function", function() {
      // arrange
      const func1 = t.functionDeclaration(
        t.identifier("func1"),
        [],
        t.blockStatement([t.expressionStatement(t.stringLiteral("test"))])
      );
      registry.registerFunction(func1);

      // act
      registry.registerEntryFunction(func1);

      // assert
      expect(registry.entryFunctions).to.eql([
        {
          functionId: "static:test.js/func1",
          identifier: func1.id,
          node: func1
        }
      ]);
    });

    it("returns the registration", function() {
      // arrange
      const func1 = t.functionDeclaration(
        t.identifier("func1"),
        [],
        t.blockStatement([t.expressionStatement(t.stringLiteral("test"))])
      );

      // act, assert
      expect(registry.registerEntryFunction(func1)).to.eql({
        functionId: "static:test.js/func1",
        identifier: func1.id,
        node: func1
      });
    });
  });

  describe("addEnvironmentVariable", function() {
    it("adds the variable with the given name to the environment variables", function() {
      // act
      registry.addEnvironmentVariable("x");

      // assert
      expect(registry.environmentVariables).to.eql(["x"]);
    });

    it("only adds unique variable names", function() {
      // arrange
      registry.addEnvironmentVariable("x");

      // act
      registry.addEnvironmentVariable("x");

      // assert
      expect(registry.environmentVariables).to.eql(["x"]);
    });
  });

  describe("addEnvironmentVariables", function() {
    it("adds all environment variables of the array", function() {
      // act
      registry.addEnvironmentVariables(["x", "y", "z"]);

      // assert
      expect(registry.environmentVariables).to.eql(["x", "y", "z"]);
    });

    it("only adds unique variable names", function() {
      // arrange
      registry.addEnvironmentVariable("x");

      // act
      registry.addEnvironmentVariables(["x", "y", "y"]);

      // assert
      expect(registry.environmentVariables).to.eql(["x", "y"]);
    });
  });

  describe("addFunctionTranspilationResult", function() {
    it("adds the transpilation result that can be retrieved using the original function node", function() {
      // arrange
      const func = t.functionDeclaration(t.identifier("test"), [], t.blockStatement([]));
      const transpiled = cloneNode(func);

      const result = { environmentVariables: [], transpiledFunctor: transpiled };

      // act
      registry.addFunctionTranspilationResult(func, result);

      // assert
      expect(registry.getFunctionTranspilationResult(func)).to.equal(result);
    });
  });

  function cloneNode<T extends t.Node>(node: T): T {
    return (t as any).cloneDeep(node) as T;
  }
});
