import {expect, use} from "chai";
import * as sinon from "sinon";
import * as sinonChai from "sinon-chai";
import generate from "babel-generator";
import * as t from "babel-types";
import {isFunctionId, isSerializedFunctionCall} from "parallel-es";

import {createFunctionId, createSerializedFunctionCall, toFunctionDeclaration} from "../src/util";
import {Scope} from "babel-traverse";

use(sinonChai);

describe("util", function () {
    describe("createFunctionId", function () {
        it("returns a serialized function id", function () {
            // act
            const functionIdAst = createFunctionId("abcd");
            let functionId = evaluate(functionIdAst);

            // assert
            expect(isFunctionId(functionId)).to.be.true;
        });

        it("sets the identifier", function () {
            // act
            const functionIdAst = createFunctionId("abcd");
            let functionId = evaluate(functionIdAst);

            // assert
            expect(functionId).to.eql({
                _______isFunctionId: true,
                identifier: "abcd"
            });
        });
    });

    describe("createSerializedFunctionCall", function () {
        it("returns a serialized function call", function () {
            const functionId = createFunctionId("abcd");

            // act
            const serializedCallNode = createSerializedFunctionCall(functionId, []);
            let functionCall = evaluate(serializedCallNode);

            // assert
            expect(isSerializedFunctionCall(functionCall)).to.be.true;
        });

        it("serialized the parameters", function () {
            const functionId = createFunctionId("abcd");

            // act
            const serializedCallNode = createSerializedFunctionCall(functionId, [t.numericLiteral(10), t.stringLiteral("test")]);
            let functionCall = evaluate(serializedCallNode);

            // assert
            expect(functionCall).to.eql({
                ______serializedFunctionCall: true,
                functionId: {
                    _______isFunctionId: true,
                    identifier: "abcd"
                },
                parameters: [10, "test"]
            });
        });
    });

    describe("toFunctionDeclaration", function () {
        let scope: Scope;
        let generateUidIdentifierStub: Sinon.SinonStub;

        beforeEach(function () {
            generateUidIdentifierStub = sinon.stub();
            scope = { generateUidIdentifier: generateUidIdentifierStub } as any;
        });

        it("returns the unmodified function declaration", function () {
            // arrange
            const functionDeclaration = t.functionDeclaration(t.identifier("test"), [t.identifier("x") as any], t.blockStatement([t.returnStatement(t.identifier("x)"))]));

            // act
            const transformed = toFunctionDeclaration(functionDeclaration, scope);

            // assert
            expect(transformed).to.equal(functionDeclaration);
        });

        it("transforms the function expression to a function declaration", function () {
            // arrange
            const functionExpression = t.functionExpression(t.identifier("test"), [t.identifier("x") as any], t.blockStatement([t.returnStatement(t.identifier("x)"))]));

            // act
            const transformed = toFunctionDeclaration(functionExpression, scope);

            // assert
            expect(transformed).to.eql(t.functionDeclaration(t.identifier("test"), [t.identifier("x") as any], t.blockStatement([t.returnStatement(t.identifier("x)"))])));
        });

        it("assigns the function expression an id if it has none", function () {
            // arrange
            generateUidIdentifierStub.returns(t.identifier("uniqueId"));
            const functionExpression = t.functionExpression(undefined, [t.identifier("x") as any], t.blockStatement([t.returnStatement(t.identifier("x)"))]));

            // act
            const transformed = toFunctionDeclaration(functionExpression, scope);

            // assert
            expect(transformed).to.eql(t.functionDeclaration(t.identifier("uniqueId"), [t.identifier("x") as any], t.blockStatement([t.returnStatement(t.identifier("x)"))])));
        });

        it("converts the arrow function expression to a function declaration", function () {
            // arrange
            generateUidIdentifierStub.returns(t.identifier("uniqueId"));
            const arrowFunctionExpression = t.arrowFunctionExpression([t.identifier("x") as any], t.identifier("x)"));

            // act
            const transformed = toFunctionDeclaration(arrowFunctionExpression, scope);

            // assert
            expect(transformed).to.eql(t.functionDeclaration(t.identifier("uniqueId"), [t.identifier("x") as any], t.blockStatement([t.returnStatement(t.identifier("x)"))])));
        });

        it("fails for other function types", function () {
            // arrange
            const method = t.objectMethod("method", t.identifier("test"), [], t.blockStatement([t.returnStatement(t.stringLiteral("test"))]));

            // act, assert
            expect(() => toFunctionDeclaration(method, scope)).to.throw("Not supported conversion of ObjectMethod to a FunctionDeclaration.");
        });
    });

    function evaluate(node: t.Node): any {
        /* tslint:disable:no-eval */
        const code = generate(node);
        let result: any;
        eval(`result = ${code.code}`);
        return result!;
    }
});
