import {expect} from "chai";
import * as t from "babel-types";
import {transform, BabelFileResult} from "babel-core";
import {ModulesUsingParallelRegistry} from "../../src/modules-using-parallel-registry";
import {createReWriterVisitor} from "../../src/worker-rewriter/worker-rewriter-visitor";
import {WORKER_FUNCTORS_REGISTRATION_MARKER} from "../../src/constants";
import {ModuleFunctionsRegistry} from "../../src/function-extractor/module-functions-registry";
import {toPath} from "../test-utils";
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
            const result = visit();

            // assert
            const registerCall = ((result.ast as t.File).program.body[0] as t.ExpressionStatement).expression as t.CallExpression;
            expect(registerCall).to.have.deep.property("arguments[1]").that.eqls(functionExpression);
        });
    });

    describe("ArrowFunctionExpression", function () {
        let module: ModuleFunctionsRegistry;
        let arrowExpression: t.ArrowFunctionExpression;

        beforeEach(function() {
            module = new ModuleFunctionsRegistry("test.js");
            arrowExpression = t.arrowFunctionExpression([], t.blockStatement([]));
            module.registerFunction(toPath(arrowExpression));
            registry.add(module);
        });

        it("passes the function expression to the register call", function () {
            // act
            const result = visit();

            // assert
            const registerCall = ((result.ast as t.File).program.body[0] as t.ExpressionStatement).expression as t.CallExpression;
            expect(registerCall).to.have.deep.property("arguments[1]").that.eqls(arrowExpression);
        });
    });

    describe("Imports", function () {
        let module: ModuleFunctionsRegistry;
        let functor: NodePath<t.Function>;
        let program: NodePath<t.Program>;

        beforeEach(function () {
            module = new ModuleFunctionsRegistry("test.js");
            program = toPath(`
                import * as _ from "lodash";
                
                function double(values) {
                    return _.map(values, value => value * 2);
                }
            `);
            functor = program.get("body.1") as NodePath<t.Function>;

            module.imports.addNamespaceImport("lodash", "_", functor);
            module.registerFunction(functor);
            registry.add(module);
        });

        it("adds the imports to the returned file", function () {
            // act
            const result = visit();

            // assert
            const body = (result.ast as t.File).program.body;
            expect(body[0]).to.have.property("type").that.equals("ImportDeclaration");
            expect(body[0]).to.have.deep.property("source.value").that.equals("lodash");
            expect(body[0]).to.have.deep.property("specifiers[0].type").that.equals("ImportNamespaceSpecifier");
            expect(body[0]).to.have.deep.property("specifiers[0].local.name").that.equals("_2");
        });

        it("collapses equal imports and renames all references", function () {
            // arrange
            let program2 = toPath(`
                import * as lodash from "lodash";
                
                function double(values) {
                    return lodash.map(values, value => value * 2);
                }
            `);
            let functor2 = program2.get("body.1") as NodePath<t.Function>;

            let secondModule = new ModuleFunctionsRegistry("b.js");
            secondModule.registerFunction(functor2);
            secondModule.imports.addNamespaceImport("lodash", "lodash", functor2);
            registry.add(secondModule);

            // act
            const result = visit();

            // assert
            const body = (result.ast as t.File).program.body;
            const double1 = body[1];
            const double2 = body[3];

            expect(double1).to.have.property("type").that.equals("FunctionDeclaration");
            expect(double1).to.have.deep.property("body.body[0].argument.callee.object.name").that.equals("_2");

            expect(double2).to.have.property("type").that.equals("FunctionDeclaration");
            expect(double2).to.have.deep.property("body.body[0].argument.callee.object.name").that.equals("_2");
        });

        it("renames references to the new name of the import", function () {
            // act
            const result = visit();

            // assert
            const body = (result.ast as t.File).program.body;
            const testFunction = body[1];

            expect(testFunction).to.have.property("type").that.equals("FunctionDeclaration");
            expect(testFunction).to.have.deep.property("body.body[0].argument.callee.object.name").that.equals("_2");
        });
    });

    function visit(code?: string): BabelFileResult {
        code = code || `/* ${WORKER_FUNCTORS_REGISTRATION_MARKER} */
        
        function after() {}`;

        return transform(code, {
            plugins: [ { visitor: createReWriterVisitor(registry) }]
        });
    }
});
