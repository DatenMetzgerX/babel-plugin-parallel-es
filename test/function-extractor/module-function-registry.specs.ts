import {expect} from "chai";
import * as t from "babel-types";
import * as sinon from "sinon";
import {ModuleFunctionsRegistry} from "../../src/function-extractor/module-functions-registry";
import {Scope} from "babel-traverse";

describe("ModuleFunctionRegistry", function () {

    let registry: ModuleFunctionsRegistry;
    let scope: Scope;
    let hasBindingSpy: Sinon.SinonStub;
    let generateUidIdentifierBasedOnNodeSpy: Sinon.SinonStub;

    beforeEach(function () {
        hasBindingSpy = sinon.stub().returns(true);
        generateUidIdentifierBasedOnNodeSpy = sinon.stub();
        scope = { generateUidIdentifierBasedOnNode: generateUidIdentifierBasedOnNodeSpy, hasBinding: hasBindingSpy } as any;
        registry = new ModuleFunctionsRegistry("test.js", scope);
    });

    it("has the module name passed in the constructor", function () {
        // assert
        expect(registry.fileName).to.equal("test.js");
    });

    it("has no source map by default", function () {
        // assert
        expect(registry.map).to.be.undefined;
    });

    it("has the source map passed in the constructor", function () {
        // arrange
        const sourceMap = {} as any;

        // act
        registry = new ModuleFunctionsRegistry("test.js", scope, sourceMap);

        // assert
        expect(registry.map).to.equal(sourceMap);
    });

    describe("functions", function () {
        it("returns an empty array by default", function () {
            expect(registry.functions).to.eql([]);
        });
    });

    describe("entryFunctions", function () {
        it("returns an empty array by default", function () {
            expect(registry.entryFunctions).to.eql([]);
        });
    });

    describe("registerFunction", function () {
        it("registers the given functions", function () {
            // arrange
            const func1 = t.functionDeclaration(t.identifier("func1"), [], t.blockStatement([t.expressionStatement(t.stringLiteral("test"))]));
            registry.registerFunction(func1);

            const func2 = t.functionDeclaration(t.identifier("func2"), [], t.blockStatement([t.expressionStatement(t.stringLiteral("test"))]));
            registry.registerFunction(func2);

            // act, assert
            expect(registry.functions).to.eql([func1, func2]);
        });

        it("registers a function only once when called multiple times", function () {
            // arrange
            const func1 = t.functionDeclaration(t.identifier("func1"), [], t.blockStatement([t.expressionStatement(t.stringLiteral("test"))]));
            registry.registerFunction(func1);

            // act
            registry.registerFunction(func1);

            // assert
            expect(registry.functions).to.eql([func1]);
        });

        it("returns the identifier of the registered function", function () {
            // arrange
            const func1 = t.functionDeclaration(t.identifier("func1"), [], t.blockStatement([t.expressionStatement(t.stringLiteral("test"))]));

            // act, assert
            expect(registry.registerFunction(func1)).to.equal(func1.id);
        });

        it("assigns the function a new unique id if the binding is not global (locally inside of a function)", function () {
            // arrange
            const uniqueName = t.identifier("_name");
            hasBindingSpy.returns(false);
            generateUidIdentifierBasedOnNodeSpy.returns(uniqueName);
            const func1 = t.functionDeclaration(t.identifier("func1"), [], t.blockStatement([t.expressionStatement(t.stringLiteral("test"))]));

            // act
            registry.registerFunction(func1);

            // assert
            expect(func1.id).to.equal(uniqueName);
        });

        it("returns the new generated id for a not globally bound function", function () {
            // arrange
            const uniqueName = t.identifier("_name");
            hasBindingSpy.returns(false);
            generateUidIdentifierBasedOnNodeSpy.returns(uniqueName);
            const func1 = t.functionDeclaration(t.identifier("func1"), [], t.blockStatement([t.expressionStatement(t.stringLiteral("test"))]));

            // act, assert
            expect(registry.registerFunction(func1)).to.equal(uniqueName);
        });

        it("throws if the passed node is not a Function-Declaration", function () {
            // arrange
            const statement = t.expressionStatement(t.stringLiteral("test"));

            // act, assert
            expect(() => registry.registerFunction(statement as any)).to.throw(`Expected type "FunctionDeclaration" with option {}`);
        });
    });

    describe("registerEntryFunction", function () {
        it("registers the function", function () {
            // arrange
            const func1 = t.functionDeclaration(t.identifier("func1"), [], t.blockStatement([t.expressionStatement(t.stringLiteral("test"))]));

            // act
            registry.registerEntryFunction(func1);

            // assert
            expect(registry.entryFunctions).to.eql([{
                functionId: "static:test.js/func1",
                identifier: func1.id,
                node: func1
            }]);
        });

        it("registers the function only once", function () {
            // arrange
            const func1 = t.functionDeclaration(t.identifier("func1"), [], t.blockStatement([t.expressionStatement(t.stringLiteral("test"))]));

            // act
            registry.registerEntryFunction(func1);
            registry.registerEntryFunction(func1);

            // assert
            expect(registry.entryFunctions).to.eql([{
                functionId: "static:test.js/func1",
                identifier: func1.id,
                node: func1
            }]);
        });

        it("adds a registration for an already registered, non entry function", function () {
            // arrange
            const func1 = t.functionDeclaration(t.identifier("func1"), [], t.blockStatement([t.expressionStatement(t.stringLiteral("test"))]));
            registry.registerFunction(func1);

            // act
            registry.registerEntryFunction(func1);

            // assert
            expect(registry.entryFunctions).to.eql([{
                functionId: "static:test.js/func1",
                identifier: func1.id,
                node: func1
            }]);
        });

        it("returns the registration", function () {
            // arrange
            const func1 = t.functionDeclaration(t.identifier("func1"), [], t.blockStatement([t.expressionStatement(t.stringLiteral("test"))]));

            // act, assert
            expect(registry.registerEntryFunction(func1)).to.eql({
                functionId: "static:test.js/func1",
                identifier: func1.id,
                node: func1
            });
        });
    });

    describe("empty", function () {
        it("returns true by default", function () {
            expect(registry.empty).to.be.true;
        });

        it("returns false if the registry contains a registration", function () {
            // arrange
            const declaration = t.functionDeclaration(t.identifier("func1"), [], t.blockStatement([t.expressionStatement(t.stringLiteral("test"))]));
            registry.registerFunction(declaration);

            // act, assert
            expect(registry.empty).to.be.false;
        });
    });
});
