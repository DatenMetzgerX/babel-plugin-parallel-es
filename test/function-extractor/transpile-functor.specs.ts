import * as sinon from "sinon";
import {expect, use} from "chai";
import * as sinonChai from "sinon-chai";
import * as t from "babel-types";
import {NodePath} from "babel-traverse";
import {transpileFunctor} from "../../src/function-extractor/transpile-functor";
import {ModuleFunctionsRegistry} from "../../src/function-extractor/module-functions-registry";
import {toPath} from "../test-utils";

use(sinonChai);

describe("TranspileFunctors", function () {

    let registry: ModuleFunctionsRegistry;

    beforeEach(function () {
        registry = new ModuleFunctionsRegistry("test.js");
    });

    describe("Imports", function () {
        it("registers namespace imports", function () {
            // arrange
            const addNamespaceSpy = sinon.spy(registry.imports, "addNamespaceImport");
            const program = toPath(`
            import * as _ from "lodash";
            function test() {
                _.map([1, 2, 3], value => value * 2);
            }`);
            const functor = program.get("body.1") as NodePath<t.Function>;

            // act
            transpileFunctor(functor, registry);

            // assert
            expect(addNamespaceSpy).to.have.been.calledWith("lodash", "_", functor);
        });

        it("registers default imports", function () {
            // arrange
            const addDefaultImportSpy = sinon.spy(registry.imports, "addDefaultImport");
            const program = toPath(`
            import traverse from "babel-traverse";
            function t(ast) {
                traverse(ast);
            }
            `);
            const functor = program.get("body.1") as NodePath<t.Function>;

            // act
            transpileFunctor(functor, registry);

            // assert
            expect(addDefaultImportSpy).to.have.been.calledWith("babel-traverse", "traverse", functor);
        });

        it("registers named import", function () {
            // arrange
            const addImportSpy = sinon.spy(registry.imports, "addImport");
            const program = toPath(`
            import {map} from "lodash";
            function t(ast) {
                map([1, 2, 3], value => value * 2);
            }
            `);
            const functor = program.get("body.1") as NodePath<t.Function>;

            // act
            transpileFunctor(functor, registry);

            // assert
            expect(addImportSpy).to.have.been.calledWith("lodash", "map", "map", functor);
        });
    });
});
