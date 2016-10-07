import {expect} from "chai";
import * as t from "babel-types";
import {ImportsRegistry} from "../../src/function-extractor/imports-registry";
import {NodePath} from "babel-traverse";
import {toPath} from "../test-utils";

describe("ImportsRegistry", function () {
    let registry: ImportsRegistry;
    let functor: NodePath<t.Function>;

    beforeEach(function () {
        registry = new ImportsRegistry();
        functor = toPath(t.functionDeclaration(t.identifier("test"), [], t.blockStatement([])));
    });

    describe("addImport", function () {
        it("adds the named import", function () {
            // act
            registry.addImport("lodash", "map", "lodashMap", functor);

            // assert
            const imports = registry.getImports();
            expect(imports).to.have.property("lodash");
            expect(imports).to.have.property("lodash").that.eql([{ imported: "map", local: "lodashMap", references: [functor] }]);
        });

        it("merges equal imports", function () {
            // arrange
            registry.addImport("lodash", "map", "lodashMap", functor);
            const secondFunctor = toPath(t.functionDeclaration(t.identifier("test"), [], t.blockStatement([])));

            // act
            registry.addImport("lodash", "map", "lodashMap", secondFunctor);

            // assert
            const imports = registry.getImports();
            expect(imports).to.have.property("lodash");
            expect(imports).to.have.property("lodash").that.eql([{ imported: "map", local: "lodashMap", references: [functor, secondFunctor] }]);
        });

        it("distinguishes between different imports", function() {
            // arrange
            registry.addImport("lodash", "map", "lodashMap", functor);

            // act
            registry.addImport("lodash", "filter", "filter", functor);

            // assert
            const imports = registry.getImports();
            expect(imports).to.have.property("lodash");
            expect(imports).to.have.property("lodash").that.eql([
                { imported: "map", local: "lodashMap", references: [functor] },
                { imported: "filter", local: "filter", references: [functor] }
            ]);
        });

        it("distinguishes imports of different modules", function () {
            // arrange
            registry.addImport("lodash", "map", "lodashMap", functor);

            // act
            registry.addImport("underscore", "filter", "filter", functor);

            // assert
            const imports = registry.getImports();
            expect(imports).to.have.property("lodash");
            expect(imports).to.have.property("lodash").that.eql([
                { imported: "map", local: "lodashMap", references: [functor] }
            ]);
            expect(imports).to.have.property("underscore").that.eql([
                { imported: "filter", local: "filter", references: [functor] }
            ]);
        });
    });

    describe("addDefaultImport", function () {
        it("adds an import for default", function () {
            // act
            registry.addDefaultImport("lodash", "_", functor);

            // assert
            const imports = registry.getImports();
            expect(imports).to.have.property("lodash");
            expect(imports).to.have.property("lodash").that.eql([{ imported: "default", local: "_", references: [functor] }]);
        });
    });

    describe("addNamespaceImport", function () {
        it("adds an import for the defined namespace", function () {
            // act
            registry.addImport("lodash", "*", "_", functor);

            // assert
            const imports = registry.getImports();
            expect(imports).to.have.property("lodash");
            expect(imports).to.have.property("lodash").that.eql([{ imported: "*", local: "_", references: [functor] }]);
        });
    });
});
