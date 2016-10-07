import {expect} from "chai";
import * as t from "babel-types";
import {ModuleFunctionsRegistry} from "../../src/function-extractor/module-functions-registry";
import {toPath} from "../test-utils";

describe("ModuleFunctionRegistry", function () {

    let registry: ModuleFunctionsRegistry;

    beforeEach(function () {
        registry = new ModuleFunctionsRegistry("test.js");
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
        registry = new ModuleFunctionsRegistry("test.js", sourceMap);

        // assert
        expect(registry.map).to.equal(sourceMap);
    });

    describe("functions", function () {
        it("returns an empty array by default", function () {
            expect(registry.functions).to.eql([]);
        });
    });

    describe("registerFunction", function () {
        it("registers the given functions", function () {
            // arrange
            const func1 = t.functionDeclaration(t.identifier("func1"), [], t.blockStatement([t.expressionStatement(t.stringLiteral("test"))]));
            const pathFunc1 = toPath(func1);
            registry.registerFunction(pathFunc1);

            const func2 = t.functionDeclaration(t.identifier("func2"), [], t.blockStatement([t.expressionStatement(t.stringLiteral("test"))]));
            const pathFunc2 = toPath(func2);
            pathFunc2.key = "1";
            registry.registerFunction(pathFunc2);

            // act, assert
            expect(registry.functions).to.eql([{
                identifier: "static-test.js#program.body[0]",
                node: func1
            }, {
                identifier: "static-test.js#program.body[1]",
                node: func2
            }]);
        });

        it("registers a function only once when called multiple times", function () {
            // arrange
            const func1 = t.functionDeclaration(t.identifier("func1"), [], t.blockStatement([t.expressionStatement(t.stringLiteral("test"))]));
            const pathFunc1 = toPath(func1);
            registry.registerFunction(pathFunc1);

            // act
            registry.registerFunction(pathFunc1);

            // assert
            expect(registry.functions).to.eql([{
                identifier: "static-test.js#program.body[0]",
                node: func1
            }]);
        });

        it("throws if the passed in path is neither a Function-Declaration, -Expression or -ArrowExpression", function () {
            // arrange
            const statement = t.expressionStatement(t.stringLiteral("test"));
            const path = toPath(statement);

            // act, assert
            expect(() => registry.registerFunction(path as any)).to.throw("");
        });

        it("registers the passed FunctionDeclaration", function () {
            // arrange
            const declaration = t.functionDeclaration(t.identifier("func1"), [], t.blockStatement([t.expressionStatement(t.stringLiteral("test"))]));
            const path = toPath(declaration);

            // act
            registry.registerFunction(path);

            // assert
            expect(registry.functions).to.eql([{
                identifier: "static-test.js#program.body[0]",
                node: declaration
            }]);
        });

        it("registers the passed FunctionExpression", function () {
            // arrange
            const expression = t.functionExpression(t.identifier("func1"), [], t.blockStatement([t.expressionStatement(t.stringLiteral("test"))]));
            const path = toPath(t.expressionStatement(expression)).get("expression");

            // act
            registry.registerFunction(path as any);

            // assert
            expect(registry.functions).to.eql([{
                identifier: "static-test.js#program.body[0].expression",
                node: expression
            }]);
        });

        it("registers the passed ArrowFunctionExpression", function () {
            const expression = t.arrowFunctionExpression([], t.blockStatement([t.expressionStatement(t.stringLiteral("test"))]));
            const path = toPath(t.expressionStatement(expression)).get("expression");

            // act
            registry.registerFunction(path as any);

            // assert
            expect(registry.functions).to.eql([{
                identifier: "static-test.js#program.body[0].expression",
                node: expression
            }]);
        });
    });

    describe("empty", function () {
        it("returns true by default", function () {
            expect(registry.empty).to.be.true;
        });

        it("returns false if the registry contains a registration", function () {
            // arrange
            const declaration = t.functionDeclaration(t.identifier("func1"), [], t.blockStatement([t.expressionStatement(t.stringLiteral("test"))]));
            const path = toPath(declaration);
            registry.registerFunction(path);

            // act, assert
            expect(registry.empty).to.be.false;
        });
    });
});
