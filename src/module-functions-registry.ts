import * as t from "babel-types";
import {Scope} from "babel-traverse";
import {RawSourceMap} from "source-map";
import {ImportsRegistry} from "./function-extractor/imports-registry";
import {IEntryFunctionRegistration} from "./function-registration";
import {ITranspileParallelFunctorResult} from "./function-extractor/transpile-parallel-functor-result";

/**
 * Registry that stores the state for a single module.
 * The following information is needed by the worker rewriter and therefore stored in this registry
 * - functions used in parallel code
 * - Entry functions (special form of function, e.g. the mapper in chain.map(mapper)) that needs to be registered in the lookup table on the worker
 * - Used imports
 */
export class ModuleFunctionsRegistry {
    /**
     * Stores the imports referenced in functions executed on the worker
     */
    public imports = new ImportsRegistry();

    private environmentVariablesRegistry = new Set<string>();
    private entryFunctionRegistry = new Map<t.Identifier, IEntryFunctionRegistration>();
    private functionsRegistry = new Set<t.FunctionDeclaration>();
    private transpiledFunctions = new Map<t.Node, ITranspileParallelFunctorResult>();

    /**
     * Returns all functions used by the worker in this module
     * @returns the used functions (normal and entry functions)
     */
    public get functions(): t.FunctionDeclaration[] {
        return Array.from(this.functionsRegistry.values());
    }

    /**
     * The used entry functions
     * @returns the definition of the entry functions
     */
    public get entryFunctions() {
        return Array.from(this.entryFunctionRegistry.values());
    }

    /**
     * Returns the names of the environment variables used inside the functions
     * @returns array containing the unique variable names
     */
    public get environmentVariables() {
        return Array.from(this.environmentVariablesRegistry.values());
    }

    /**
     * Indicator if this module contains any functions executed on a worker
     * @returns {boolean} true if the module does never pass a functor to parallel
     */
    public get empty() {
        return this.functionsRegistry.size === 0;
    }

    /**
     * Creates a new instance
     * @param fileName the module file name
     * @param programScope the scope of this module
     * @param map an input source map, if available
     */
    constructor(public fileName: string, public programScope: Scope, public map?: RawSourceMap) {
    }

    /**
     * Registers a new function transpiled function declaration
     * @param transpiled the transpiled function declaration. Gets assigned a unique identifier.
     * @returns the unique identifier for this function in the module
     */
    public registerFunction(transpiled: t.FunctionDeclaration): t.Identifier {
        t.assertFunctionDeclaration(transpiled);

        if (this.functionsRegistry.has(transpiled)) {
            return transpiled.id;
        }

        // If the name is already globally unique, then no new id is needed
        if (!this.programScope.hasBinding(transpiled.id.name)) {
            // assign a module unique name
            transpiled.id = this.programScope.generateUidIdentifierBasedOnNode(transpiled.id);
        }

        this.functionsRegistry.add( transpiled);
        return transpiled.id;
    }

    /**
     * Registers an entry function (one that is called from parallel.*).
     * @param func the function to register
     * @returns {IEntryFunctionRegistration} the registration for this function
     */
    public registerEntryFunction(transpiled: t.FunctionDeclaration): IEntryFunctionRegistration {
        const identifier = this.registerFunction(transpiled);

        const existing = this.entryFunctionRegistry.get(identifier);
        if (existing) {
            return existing;
        }

        const registration: IEntryFunctionRegistration = {
            functionId: `static:${this.fileName}/${identifier.name}`,
            identifier,
            node: transpiled
        };

        this.entryFunctionRegistry.set(identifier, registration);
        return registration;
    }

    /**
     * Adds the name of a variable from the outer scope that is used inside of a function
     * @param name the name of the variable
     */
    public addEnvironmentVariable(name: string) {
        this.environmentVariablesRegistry.add(name);
    }

    /**
     * Adds all the names of the variables from the outer scope used inside of a function
     * @param environmentVariables the variable names
     */
    public addEnvironmentVariables(environmentVariables: string[]) {
        for (const variable of environmentVariables) {
            this.addEnvironmentVariable(variable);
        }
    }

    /**
     * Adds the result of a function transpilation that can be used to retrieve it if the same function is referenced
     * again
     * @param original the original function that has been transpiled
     * @param result the transpilation result
     */
    public addFunctionTranspilationResult(original: t.Function, result: ITranspileParallelFunctorResult) {
        t.assertFunction(original);

        this.transpiledFunctions.set(original, result);
    }

    /**
     * Returns the transpilation result for the given function or undefined if the function has not yet been transpiled
     * @param original the original function
     * @returns the transpilation result if the function has once been transpiled or undefined otherwise
     */
    public getFunctionTranspilationResult(original: t.Function): ITranspileParallelFunctorResult | undefined {
        return this.transpiledFunctions.get(original);
    }
}
