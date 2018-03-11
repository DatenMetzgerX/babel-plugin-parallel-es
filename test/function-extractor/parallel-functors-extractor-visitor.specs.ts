import { expect } from "chai";
import * as sinon from "sinon";
import { transform } from "babel-core";
import { ParallelFunctorsExtractorVisitor } from "../../src/function-extractor/parallel-functors-extractor-visitor";
import { ModulesUsingParallelRegistry } from "../../src/modules-using-parallel-registry";
import { PARALLEL_ES_MODULE_NAME } from "../../src/constants";
import { RawSourceMap } from "source-map";
import { ModuleFunctionsRegistry } from "../../src/module-functions-registry";

describe("ParallelFunctorsExtractorVisitor", function() {
  let registry: ModulesUsingParallelRegistry;
  let addModuleSpy: sinon.SinonSpy;
  let removeModuleSpy: sinon.SinonSpy;

  beforeEach(function() {
    registry = new ModulesUsingParallelRegistry();
    addModuleSpy = sinon.spy(registry, "add");
    removeModuleSpy = sinon.spy(registry, "remove");
  });

  afterEach(function() {
    addModuleSpy.restore();
    removeModuleSpy.restore();
  });

  describe("commonjs", function() {
    it("recognizes parallel imports using commonjs", function() {
      // act
      visit(`
            const parallel = require("parallel-es");
            
            parallel.from([1, 2, 3]).map(value => value * 2);
            `);

      // assert
      // tslint:disable-next-line:no-unused-expression
      expect(addModuleSpy.calledOnce).to.be.true;
    });

    it("does not register functors for objects named parallel but pointing to another module", function() {
      // act
      visit(`
            const parallel = require("other");
            
            parallel.from([1, 2, 3]).map(value => value * 2);
            `);

      // assert
      // tslint:disable-next-line:no-unused-expression
      expect(addModuleSpy.calledOnce).to.be.false;
    });
  });

  describe("ES6-imports", function() {
    describe("default", function() {
      it("recognizes parallel default imports", function() {
        // act
        visit(`
            import parallel from "parallel-es";
            
            parallel.from([1, 2, 3]).map(value => value * 2);
            `);

        // assert
        // tslint:disable-next-line:no-unused-expression
        expect(addModuleSpy.calledOnce).to.be.true;
      });

      it("does not register functors for objects named parallel but pointing to another module", function() {
        // act
        visit(`
            import parallel from "other";
            
            parallel.from([1, 2, 3]).map(value => value * 2);
            `);

        // assert
        // tslint:disable-next-line:no-unused-expression
        expect(addModuleSpy.calledOnce).to.be.false;
      });
    });

    describe("named import", function() {
      it("recognizes named parallel imports", function() {
        // act
        visit(`
                import {default as parallelES} from "parallel-es";
                
                parallelES.from([1, 2, 3]).map(value => value * 2);
                `);

        // assert
        // tslint:disable-next-line:no-unused-expression
        expect(addModuleSpy.calledOnce).to.be.true;
      });

      it("does not register functors for objects named parallel but pointing to another module", function() {
        // act
        visit(`
                import {parallel  as parallelES} from "other";
                
                parallelES.from([1, 2, 3]).map(value => value * 2);
                `);

        // assert
        // tslint:disable-next-line:no-unused-expression
        expect(addModuleSpy.calledOnce).to.be.false;
      });
    });
  });

  describe("ModuleRegistration", function() {
    it("registers the module if at least one function has been extracted", function() {
      visit(`
            import parallel from "${PARALLEL_ES_MODULE_NAME}";
            parallel.from([1, 2, 3]).map(value => value * 2);
            `);

      expect(addModuleSpy).to.have.been.calledWithMatch({ fileName: "test.js" });
    });

    it("does not register the module if the file does not include any call to parallel.*", function() {
      visit(`
            import parallel from "${PARALLEL_ES_MODULE_NAME}";
            console.log("10");
            `);

      // tslint:disable-next-line:no-unused-expression
      expect(addModuleSpy).not.to.have.been.called;
    });

    it("removes existing registered modules", function() {
      visit(`
            import parallel from "${PARALLEL_ES_MODULE_NAME}";
            parallel.from([1, 2, 3]).map(value => value * 2);
            `);

      expect(removeModuleSpy).to.have.been.calledWithMatch("test.js");
    });
  });

  describe("SourceMaps", function() {
    it("uses a copy of the input source map in the module", function() {
      // arrange
      const sourceMap = { file: "test.js", mappings: "", names: [], sources: [], sourcesContent: [], version: 3 };

      // act
      visit(
        `
                import parallel from "${PARALLEL_ES_MODULE_NAME}";
                parallel.from([1, 2, 3]).map(value => value * 2);
            `,
        sourceMap
      );

      // assert
      // tslint:disable-next-line:no-unused-expression
      expect(addModuleSpy).to.have.been.called;
      const addedModule = addModuleSpy.firstCall.args[0];
      expect(addedModule).to.have.property("fileName", "test.js");
      expect(addedModule)
        .to.have.property("map")
        .not.equal(sourceMap);
    });

    it("creates a source map if input source map is not set", function() {
      // arrange
      const source = `
            import parallel from "${PARALLEL_ES_MODULE_NAME}";
            parallel.from([1, 2, 3]).map(value => value * 2);
            `;

      // act
      visit(source);

      // assert
      const addedModule = addModuleSpy.firstCall.args[0] as ModuleFunctionsRegistry;
      expect(addedModule.map).to.eql({
        file: "test.js",
        mappings: "",
        names: [],
        sourceRoot: undefined,
        sources: ["test.js"],
        sourcesContent: [source],
        version: 3
      });
    });
  });

  function visit(code: string, inputSourceMap?: RawSourceMap) {
    return transform(code, {
      filename: "test.js",
      inputSourceMap,
      plugins: [{ visitor: ParallelFunctorsExtractorVisitor(registry) }]
    });
  }
});
