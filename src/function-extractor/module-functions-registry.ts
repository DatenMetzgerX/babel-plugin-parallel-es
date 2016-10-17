import * as t from "babel-types";
import {Scope} from "babel-traverse";
import {RawSourceMap} from "source-map";
import {ImportsRegistry} from "./imports-registry";
import {IEntryFunctionRegistration} from "../function-registration";

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

    private entryFunctionRegistry = new Map<t.Identifier, IEntryFunctionRegistration>();
    private functionsRegistry = new Map<t.FunctionDeclaration, t.Identifier>();

    /**
     * Returns all functions used by the worker in this module
     * @returns the used functions (normal and entry functions)
     */
    public get functions(): t.FunctionDeclaration[] {
        return Array.from(this.functionsRegistry.keys());
    }

    /**
     * The used entry functions
     * @returns the definition of the entry functions
     */
    public get entryFunctions() {
        return Array.from(this.entryFunctionRegistry.values());
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
     * Registers a new function
     * @param funct the function
     * @returns the unique identifier for this function in the module
     */
    public registerFunction(node: t.FunctionDeclaration): t.Identifier {
        t.assertFunctionDeclaration(node);

        const existing = this.functionsRegistry.get(node);
        if (existing) {
            return existing;
        }

        // If the name is already globally unique, then no new id is needed
        if (!this.programScope.hasBinding(node.id.name)) {
            // assign a module unique name
            node.id = this.programScope.generateUidIdentifierBasedOnNode(node.id);
        }

        this.functionsRegistry.set(node, node.id);
        return node.id;
    }

    /**
     * Registers an entry function (one that is called from parallel.*).
     * @param func the function to register
     * @returns {IEntryFunctionRegistration} the registration for this function
     */
    public registerEntryFunction(func: t.FunctionDeclaration): IEntryFunctionRegistration {
        const identifier = this.registerFunction(func);

        const existing = this.entryFunctionRegistry.get(identifier);
        if (existing) {
            return existing;
        }

        const registration: IEntryFunctionRegistration = {
            functionId: `static:${this.fileName}/${identifier.name}`,
            identifier,
            node: func
        };

        this.entryFunctionRegistry.set(identifier, registration);
        return registration;
    }
}
