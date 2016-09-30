import * as t from "babel-types";
import {NodePath} from "babel-traverse";
import {ModuleFunctionsRegistry} from "./module-functions-registry";
import {FunctionNode, IFunctionRegistration} from "./function-registration";

export class StaticFunctionRegistry {

    public version = 0;

    public get modules() {
        return Array.from(this.modulesLookupTable.values());
    }

    private modulesLookupTable = new Map<string, ModuleFunctionsRegistry>();

    constructor() {}

    /**
     * Removes the given module from the registry
     * @param name file name of the module to remove
     * @returns true if the module has been removed, false if it was not registered at all
     */
    public remove(name: string): boolean {
        ++this.version;
        return this.modulesLookupTable.delete(name);
    }

    /**
     * Registers the given module
     * @param module the module to register
     */
    public add(module: ModuleFunctionsRegistry): void {
        ++this.version;
        this.modulesLookupTable.set(module.fileName, module);
    }

    /**
     * Tests if the given module is registered
     * @param name the name of the module
     * @returns {boolean} true if the module is registered
     */
    public has(name: String): boolean {
        return this.modulesLookupTable.has(name);
    }

    /**
     * Returns the module with the given name
     * @param name the file name of the module to lookup
     * @returns the resolved module registry or undefined
     */
    public get(name: String): ModuleFunctionsRegistry | undefined {
        return this.modulesLookupTable.get(name);
    }
}
