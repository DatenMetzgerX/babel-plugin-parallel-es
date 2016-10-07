import {expect} from "chai";
import * as t from "babel-types";
import traverse from "babel-traverse";
import {transform, BabelFileResult} from "babel-core";
import {ModulesUsingParallelRegistry} from "../../src/modules-using-parallel-registry";
import {createReWriterVisitor} from "../../src/worker-rewriter/worker-rewriter-visitor";
import {WORKER_FUNCTORS_REGISTRATION_MARKER} from "../../src/constants";
import {ModuleFunctionsRegistry} from "../../src/function-extractor/module-functions-registry";
import {NodePath} from "babel-traverse";

describe("WorkerReWriterVisitor", function () {

    let registry: ModulesUsingParallelRegistry;

    beforeEach(function () {
        registry = new ModulesUsingParallelRegistry();
    });

    it(`inserts the registration after the ${WORKER_FUNCTORS_REGISTRATION_MARKER}`, function () {
        // arrange
        const module = new ModuleFunctionsRegistry("test'.js");
        const functionDeclaration = t.functionDeclaration(t.identifier("test"), [], t.blockStatement([]));
        module.registerFunction(toPath(functionDeclaration));
        registry.add(module);

        // act
        const result = visit(`
        function before() {}
        
        /* ${WORKER_FUNCTORS_REGISTRATION_MARKER} */
        
        function after() {}
        `);

        // assert
        const registerStatement = (result.ast as t.File).program.body[2];
        expect(registerStatement).to.have.property("type").that.equals("ExpressionStatement");
        expect(registerStatement).to.have.deep.property("expression.type").that.equals("CallExpression");
        expect(registerStatement).to.have.deep.property("expression.callee.type").that.equals("MemberExpression");
        expect(registerStatement).to.have.deep.property("expression.callee.object.name").that.equals("slaveFunctionLookupTable");
        expect(registerStatement).to.have.deep.property("expression.callee.property.name").that.equals("registerStaticFunction");
    });

    it(`Removes the ${WORKER_FUNCTORS_REGISTRATION_MARKER} marker`, function () {
        // act
        const result = visit(`
        function before() {}
        
        /* ${WORKER_FUNCTORS_REGISTRATION_MARKER} */
        
        function after() {}
        `);

        // assert
        expect(result.code).to.equal(`
function before() {}

function after() {}`);
    });

    describe("FunctionDeclaration", function () {
        let module: ModuleFunctionsRegistry;
        let functionDeclaration: t.FunctionDeclaration;

        beforeEach(function() {
            module = new ModuleFunctionsRegistry("test'.js");
            functionDeclaration = t.functionDeclaration(t.identifier("test"), [], t.blockStatement([]));
            module.registerFunction(toPath(functionDeclaration));
            registry.add(module);
        });

        it("passes the (renamed) identifier of the function to the register call", function () {
            // act
            const result = visit(`
        function before() {}
        
        /* ${WORKER_FUNCTORS_REGISTRATION_MARKER} */
        
        function after() {}
        `);

            // assert
            const registerCall = ((result.ast as t.File).program.body[2] as t.ExpressionStatement).expression as t.CallExpression;
            expect(registerCall).to.have.deep.property("arguments[1]").that.eqls(functionDeclaration.id);
        });

        it("declares the function in the scope", function () {
            // act
            const result = visit(`
            /* ${WORKER_FUNCTORS_REGISTRATION_MARKER} */
            function after() {}
            `);

            // assert
            expect((result.ast as t.File).program.body[0]).to.equal(functionDeclaration);
        });

        it("assigns each declaration a unique id", function () {
            // arrange
            const functionDeclaration2 = t.functionDeclaration(t.identifier("test"), [], t.blockStatement([]));

            // act
            visit(`
            /* ${WORKER_FUNCTORS_REGISTRATION_MARKER} */
            function after() {}
            `);

            // assert
            expect(functionDeclaration.id).not.to.eql(functionDeclaration2.id);
        });
    });

    describe("FunctionExpression", function () {
        let module: ModuleFunctionsRegistry;
        let functionExpression: t.FunctionExpression;

        beforeEach(function() {
            module = new ModuleFunctionsRegistry("test'.js");
            functionExpression = t.functionExpression(t.identifier("test"), [], t.blockStatement([]));
            module.registerFunction(toPath(functionExpression));
            registry.add(module);
        });

        it("passes the function expression to the register call", function () {
            // act
            const result = visit(`
        /* ${WORKER_FUNCTORS_REGISTRATION_MARKER} */
        
        function after() {}
        `);

            // assert
            const registerCall = ((result.ast as t.File).program.body[0] as t.ExpressionStatement).expression as t.CallExpression;
            expect(registerCall).to.have.deep.property("arguments[1]").that.eqls(functionExpression);
        });
    });

    describe("ArrowFunctionExpression", function () {
        let module: ModuleFunctionsRegistry;
        let arrowExpression: t.ArrowFunctionExpression;

        beforeEach(function() {
            module = new ModuleFunctionsRegistry("test'.js");
            arrowExpression = t.arrowFunctionExpression([], t.blockStatement([]));
            module.registerFunction(toPath(arrowExpression));
            registry.add(module);
        });

        it("passes the function expression to the register call", function () {
            // act
            const result = visit(`
        /* ${WORKER_FUNCTORS_REGISTRATION_MARKER} */
        
        function after() {}
        `);

            // assert
            const registerCall = ((result.ast as t.File).program.body[0] as t.ExpressionStatement).expression as t.CallExpression;
            expect(registerCall).to.have.deep.property("arguments[1]").that.eqls(arrowExpression);
        });
    });

    function visit(code: string): BabelFileResult {
        return transform(code, {
            plugins: [ { visitor: createReWriterVisitor(registry) }]
        });
    }

    function toPath<T extends t.Expression | t.Statement>(node: T): NodePath<T> {
        let statement: t.Statement;
        if (t.isStatement(node)) {
            statement = node;
        } else {
            statement = t.expressionStatement(node as t.Expression);
        }

        let nodePath: NodePath<T> | undefined = undefined;
        traverse(t.file(t.program([statement])), {
            Program(path: NodePath<t.Program>) {
                const statementPath = path.get("body.0");
                if (t.isStatement(node)) {
                    nodePath = statementPath as NodePath<T>;
                } else {
                    nodePath = statementPath.get("expression") as NodePath<T>;
                }
            }
        });

        return nodePath!;
    }
});
