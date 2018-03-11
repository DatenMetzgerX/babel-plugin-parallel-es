import { expect } from "chai";
import * as t from "babel-types";
import {
  TranspileParallelFunctorState,
  TranspileParallelFunctorChildState
} from "../../src/function-extractor/transpile-parallel-functor-state";
import { toPath } from "../test-utils";
import { NodePath } from "babel-traverse";
import { ModuleFunctionsRegistry } from "../../src/module-functions-registry";

describe("TranspileParallelFunctorState", function() {
  let originalFunctor: NodePath<t.FunctionDeclaration>;
  let module: ModuleFunctionsRegistry;
  let state: TranspileParallelFunctorState;

  beforeEach(function() {
    originalFunctor = toPath(t.functionDeclaration(t.identifier("test"), [], t.blockStatement([])));
    module = new ModuleFunctionsRegistry("test.js", {} as any);
    state = new TranspileParallelFunctorState(originalFunctor, module);
  });

  describe("hasEnvironment", function() {
    it("is false by default", function() {
      // tslint:disable-next-line:no-unused-expression
      expect(state.hasEnvironment).to.be.false;
    });
  });

  describe("scope", function() {
    it("returns the scope of the original functor", function() {
      expect(state.scope).to.equal(originalFunctor.scope);
    });
  });

  describe("usesEnvironment", function() {
    it("returns false if the state has no environment set (default)", function() {
      // arrange
      state.hasEnvironment = false;

      // act, assert
      // tslint:disable-next-line:no-unused-expression
      expect(state.usesEnvironment).to.be.false;
    });

    it("returns false if an environment is set but the accessed variables is empty", function() {
      // arrange
      state.hasEnvironment = true;

      // act
      // tslint:disable-next-line:no-unused-expression
      expect(state.usesEnvironment).to.be.false;
    });

    it("returns true if an environment is set and the accessed variables contain at least one name", function() {
      // arrange
      state.hasEnvironment = true;
      state.addAccessedVariable("a");

      // act, assert
      // tslint:disable-next-line:no-unused-expression
      expect(state.usesEnvironment).to.be.true;
    });
  });

  describe("accessedVariables", function() {
    it("returns an empty array by default", function() {
      expect(state.accessedVariables).to.eql([]);
    });

    it("returns an array containing the registered variables", function() {
      // arrange
      state.hasEnvironment = true;
      state.addAccessedVariable("a");
      state.addAccessedVariable("b");

      // act, assert
      expect(state.accessedVariables).to.eql(["a", "b"]);
    });
  });

  describe("originalFunctor", function() {
    it("returns the functor passed in the constructor", function() {
      expect(state.originalFunctor).to.equal(originalFunctor);
    });
  });

  describe("module", function() {
    it("returns the module passed in the constructor", function() {
      expect(state.module).to.equal(module);
    });
  });

  describe("addAccessedVariable", function() {
    it("does only add unique names add duplicates", function() {
      // arrange
      state.hasEnvironment = true;

      // act
      state.addAccessedVariable("a");
      state.addAccessedVariable("b");
      state.addAccessedVariable("a");

      // assert
      expect(state.accessedVariables).to.eql(["a", "b"]);
    });
  });
});

describe("TranspileParallelFunctorChildState", function() {
  let originalFunctor: NodePath<t.FunctionDeclaration>;
  let childFunctor: NodePath<t.FunctionDeclaration>;
  let module: ModuleFunctionsRegistry;
  let parentState: TranspileParallelFunctorState;
  let childState: TranspileParallelFunctorChildState;

  beforeEach(function() {
    originalFunctor = toPath(t.functionDeclaration(t.identifier("parent"), [], t.blockStatement([])));
    childFunctor = toPath(t.functionDeclaration(t.identifier("child"), [], t.blockStatement([])));
    module = new ModuleFunctionsRegistry("test.js", {} as any);
    parentState = new TranspileParallelFunctorState(originalFunctor, module);
    parentState.hasEnvironment = true;
    childState = new TranspileParallelFunctorChildState(childFunctor, parentState);
  });

  describe("environment", function() {
    it("it returns the environment of the parent state", function() {
      expect(childState.hasEnvironment).to.be.equal(parentState.hasEnvironment);
    });
  });

  describe("scope", function() {
    it("returns the scope from the child functor", function() {
      expect(childState.scope).to.equal(childFunctor.scope);
    });
  });

  describe("usesEnvironment", function() {
    it("returns false if the parent has no environment set (default)", function() {
      // arrange
      parentState.hasEnvironment = false;

      // act, assert
      // tslint:disable-next-line:no-unused-expression
      expect(childState.usesEnvironment).to.be.false;
    });

    it("returns false if the parent has an environment but the accessed variables is empty", function() {
      // tslint:disable-next-line:no-unused-expression
      expect(childState.usesEnvironment).to.be.false;
    });

    it("returns true if the parent has an environment set and the accessed variables contain at least one name", function() {
      childState.addAccessedVariable("a");

      // act, assert
      // tslint:disable-next-line:no-unused-expression
      expect(childState.usesEnvironment).to.be.true;
    });
  });

  describe("accessedVariables", function() {
    it("returns an empty array by default", function() {
      expect(childState.accessedVariables).to.eql([]);
    });

    it("returns an array containing the registered variables", function() {
      // arrange
      childState.addAccessedVariable("a");
      childState.addAccessedVariable("b");

      // act, assert
      expect(childState.accessedVariables).to.eql(["a", "b"]);
    });
  });

  describe("originalFunctor", function() {
    it("returns the functor passed in the constructor", function() {
      expect(childState.originalFunctor).to.equal(childFunctor);
    });
  });

  describe("module", function() {
    it("returns the module from the parent state", function() {
      expect(childState.module).to.equal(module);
    });
  });

  describe("addAccessedVariable", function() {
    it("does only add unique names add duplicates", function() {
      // act
      childState.addAccessedVariable("a");
      childState.addAccessedVariable("b");
      childState.addAccessedVariable("a");

      // assert
      expect(childState.accessedVariables).to.eql(["a", "b"]);
    });

    it("does not include variables accessed only in the parent state", function() {
      // act
      childState.addAccessedVariable("a");
      parentState.addAccessedVariable("b");
      childState.addAccessedVariable("a");

      // assert
      expect(childState.accessedVariables).to.eql(["a"]);
    });

    it("does add the variables to the parent state", function() {
      // act
      childState.addAccessedVariable("a");
      childState.addAccessedVariable("b");

      // assert
      expect(parentState.accessedVariables).to.eql(["a", "b"]);
    });
  });
});
