import {expect} from "chai";
import generate from "babel-generator";
import * as t from "babel-types";
import {isFunctionId, isSerializedFunctionCall} from "parallel-es";

import {createFunctionId, createSerializedFunctionCall} from "../src/util";

describe("util", function () {
    describe("createFunctionId", function () {
        it("returns a serialized function id", function () {
            // arrange
            const registration = {
                identifier: "abcd",
                node: undefined as any
            };

            // act
            const functionIdAst = createFunctionId(registration);
            let functionId = evaluate(functionIdAst);

            // assert
            expect(isFunctionId(functionId)).to.be.true;
        });

        it("sets the identifier", function () {
            // arrange
            const registration = {
                identifier: "abcd",
                node: undefined as any
            };

            // act
            const functionIdAst = createFunctionId(registration);
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
            // arrange
            const registration = {
                identifier: "abcd",
                node: undefined as any
            };
            const functionId = createFunctionId(registration);

            // act
            const serializedCallNode = createSerializedFunctionCall(functionId, []);
            let functionCall = evaluate(serializedCallNode);

            // assert
            expect(isSerializedFunctionCall(functionCall)).to.be.true;
        });

        it("serialized the parameters", function () {
            // arrange
            const registration = {
                identifier: "abcd",
                node: undefined as any
            };
            const functionId = createFunctionId(registration);

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

    function evaluate(node: t.Node): any {
        /* tslint:disable:no-eval */
        const code = generate(node);
        let result: any;
        eval(`result = ${code.code}`);
        return result;
    }
});
