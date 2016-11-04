import {expect} from "chai";
import {ModulesUsingParallelRegistry} from "../src/modules-using-parallel-registry";
import {ModuleFunctionsRegistry} from "../src/module-functions-registry";

describe("ModulesUsingParallelRegistry", function () {
    let registry: ModulesUsingParallelRegistry;

    beforeEach(function () {
        registry = new ModulesUsingParallelRegistry();
    });

    describe("modules", function () {
        it("returns an empty array by default", function () {
            expect(registry.modules).to.eql([]);
        });

        it("returns an array containing the registered modules", function () {
            // arrange
            const firstModule = createModule("test.js");
            const secondModule = createModule("second.js");

            registry.add(firstModule);
            registry.add(secondModule);

            // act, assert
            expect(registry.modules).to.eql([firstModule, secondModule]);
        });
    });

    describe("add", function () {
        it("registers the module", function () {
            // arrange
            const module = createModule("test.js");

            // act
            registry.add(module);

            // act, assert
            expect(registry.modules).to.eql([module]);
        });

        it("freezes the module", function () {
            // arrange
            const module = createModule("test.js");

            // act
            registry.add(module);

            // act, assert
            expect(registry.get(module.fileName)).to.be.frozen;
        });
    });

    describe("remove", function () {
        let testModule: ModuleFunctionsRegistry;
        let secondModule: ModuleFunctionsRegistry;

        beforeEach(function () {
            // arrange
            testModule = createModule("test.js");
            secondModule = createModule("second.js");

            registry.add(testModule);
            registry.add(secondModule);
        });

        it("returns false if the module is not registered", function () {
            expect(registry.remove("blabla.js")).be.false;
        });

        it("removes the module if it has been registered", function () {
            // act
            registry.remove("test.js");

            // assert
            expect(registry.modules).to.eql([secondModule]);
        });

        it("returns true if the module has been removed", function () {
            expect(registry.remove("test.js")).to.be.true;
        });
    });

    describe("has", function () {
        let testModule: ModuleFunctionsRegistry;

        beforeEach(function () {
            // arrange
            testModule = createModule("test.js");

            registry.add(testModule);
        });

        it("returns false if the registry does not contain the module with the given filename", function () {
            expect(registry.has("blabla.js")).to.be.false;
        });

        it("returns true if the registry contains the module with the given filename", function () {
            expect(registry.has("test.js")).to.be.true;
        });
    });

    describe("get", function () {
        let testModule: ModuleFunctionsRegistry;

        beforeEach(function () {
            testModule = createModule("test.js");
            registry.add(testModule);
        });

        it("returns undefined if the module is not registered", function () {
            expect(registry.get("blabla.js")).to.be.undefined;
        });

        it("returns the module if registered", function () {
            expect(registry.get("test.js")).to.equal(testModule);
        });
    });

    describe("reset", function () {
        it("removes all registered modules", function () {
            // arrange
            const testModule = createModule("test.js");
            registry.add(testModule);

            // act
            registry.reset();

            // assert
            expect(registry.modules).to.be.empty;
        });
    });

    function createModule(filename: string) {
        return new ModuleFunctionsRegistry(filename, undefined as any);
    }
});
