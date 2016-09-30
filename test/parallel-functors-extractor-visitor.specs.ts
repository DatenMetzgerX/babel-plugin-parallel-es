import {expect} from "chai";
import * as sinon from "sinon";
import {transform} from "babel-core";
import {ParallelFunctorsExtractorVisitor} from "../src/parallel-functors-extractor-visitor";
import {ModulesUsingParallelRegistry} from "../src/modules-using-parallel-registry";

describe("ParallelFunctorsExtractorVisitor", function () {
    let registry: ModulesUsingParallelRegistry;
    let addModuleSpy: sinon.SinonSpy;

    beforeEach(function () {
        registry = new ModulesUsingParallelRegistry();
        addModuleSpy = sinon.spy(registry, "add");
    });

    afterEach(function () {
        addModuleSpy.restore();
    });

    describe("commonjs", function () {
        it("recognizes parallel imports using commonjs", function () {
            // act
            visit(`
            const parallel = require("parallel-es");
            
            parallel.from([1, 2, 3]).map(value => value * 2);
            `);

            // assert
            expect(addModuleSpy.calledOnce).to.be.true;
        });

        it("does not register functors for objects named parallel but pointing to another module", function () {
            // act
            visit(`
            const parallel = require("other");
            
            parallel.from([1, 2, 3]).map(value => value * 2);
            `);

            // assert
            expect(addModuleSpy.calledOnce).to.be.false;
        });
    });

    describe("ES6-imports", function () {
        describe("default", function () {
            it("recognizes parallel default imports", function () {
                // act
                visit(`
            import parallel from "parallel-es";
            
            parallel.from([1, 2, 3]).map(value => value * 2);
            `);

                // assert
                expect(addModuleSpy.calledOnce).to.be.true;
            });

            it("does not register functors for objects named parallel but pointing to another module", function () {
                // act
                visit(`
            import parallel from "other";
            
            parallel.from([1, 2, 3]).map(value => value * 2);
            `);

                // assert
                expect(addModuleSpy.calledOnce).to.be.false;
            });
        });

        describe("named import", function () {
            it("recognizes named parallel imports", function () {
                // act
                visit(`
                import {default as parallelES} from "parallel-es";
                
                parallelES.from([1, 2, 3]).map(value => value * 2);
                `);

                // assert
                expect(addModuleSpy.calledOnce).to.be.true;
            });

            it("does not register functors for objects named parallel but pointing to another module", function () {
                // act
                visit(`
                import {parallel  as parallelES} from "other";
                
                parallelES.from([1, 2, 3]).map(value => value * 2);
                `);

                // assert
                expect(addModuleSpy.calledOnce).to.be.false;
            });
        });
    });

    function visit(code: string) {
        return transform(code, { plugins: [ { visitor: ParallelFunctorsExtractorVisitor(registry) } ]} );
    }
});
