import {expect} from "chai";
import * as t from "babel-types";
import {ImportsRegistry} from "../../src/function-extractor/imports-registry";

describe("ImportsRegistry", function () {
    let registry: ImportsRegistry;

    beforeEach(function () {
        registry = new ImportsRegistry();
    });

    describe("addImport", function () {
        it("adds the named import", function () {
            // arrange
            const reference = t.identifier("lodashMap");

            // act
            registry.addImport("lodash", "map", "lodashMap", reference);

            // assert
            const imports = registry.getImports();
            expect(imports).to.have.property("lodash");
            expect(imports).to.have.property("lodash").that.eql([{ imported: "map", local: "lodashMap", references: [reference] }]);
        });

        it("merges equal imports", function () {
            // arrange
            const ref1 = t.identifier("lodashMap");
            const ref2 = t.identifier("lodashMap");
            registry.addImport("lodash", "map", "lodashMap", ref1);

            // act
            registry.addImport("lodash", "map", "lodashMap", ref2);

            // assert
            const imports = registry.getImports();
            expect(imports).to.have.property("lodash");
            expect(imports).to.have.property("lodash").that.eql([{ imported: "map", local: "lodashMap", references: [ref1, ref2] }]);
        });

        it("distinguishes between different imports", function() {
            // arrange
            const map = t.identifier("lodashMap");
            registry.addImport("lodash", "map", "lodashMap", map);

            // act
            const filter = t.identifier("lodashMap");
            registry.addImport("lodash", "filter", "filter", filter);

            // assert
            const imports = registry.getImports();
            expect(imports).to.have.property("lodash");
            expect(imports).to.have.property("lodash").that.eql([
                { imported: "map", local: "lodashMap", references: [map] },
                { imported: "filter", local: "filter", references: [filter] }
            ]);
        });

        it("distinguishes imports of different modules", function () {
            // arrange
            const lodashMap = t.identifier("lodashMap");
            registry.addImport("lodash", "map", "lodashMap", lodashMap);

            // act
            const underscoreMap = t.identifier("underscoreMap");
            registry.addImport("underscore", "map", "underscoreMap", underscoreMap);

            // assert
            const imports = registry.getImports();
            expect(imports).to.have.property("lodash");
            expect(imports).to.have.property("lodash").that.eql([
                { imported: "map", local: "lodashMap", references: [lodashMap]}
            ]);
            expect(imports).to.have.property("underscore").that.eql([
                { imported: "map", local: "underscoreMap", references: [underscoreMap] }
            ]);
        });
    });

    describe("addDefaultImport", function () {
        it("adds an import for default", function () {
            // arrange
            const ref = t.identifier("_");

            // act
            registry.addDefaultImport("lodash", "_", ref);

            // assert
            const imports = registry.getImports();
            expect(imports).to.have.property("lodash");
            expect(imports).to.have.property("lodash").that.eql([{ imported: "default", local: "_", references: [ref] }]);
        });
    });

    describe("addNamespaceImport", function () {
        it("adds an import for the defined namespace", function () {
            const ref = t.identifier("_");

            // act
            registry.addImport("lodash", "*", "_", ref);

            // assert
            const imports = registry.getImports();
            expect(imports).to.have.property("lodash");
            expect(imports).to.have.property("lodash").that.eql([{ imported: "*", local: "_", references: [ref] }]);
        });
    });
});
