import {ModuleFunctionsRegistry} from "./module-functions-registry";

/**
 * Registry that stores all modules that pass a functor to {@code parallel.*}.
 */
export class ModulesUsingParallelRegistry {

    /**
     * The version of the current state. The version changes every time a module has been added, removed or changed.
     * @type {number} the current version
     */
    public version = 0;

    /**
     * Returns the registered modules
     * @returns the modules
     */
    public get modules() {
        return Array.from(this.modulesLookupTable.values());
    }

    private modulesLookupTable = new Map<string, ModuleFunctionsRegistry>();

    /**
     * Removes the given module from the registry
     * @param name file name of the module to remove
     * @returns true if the module has been removed, false if it was not registered at all
     */
    public remove(name: string): boolean {
        const removed = this.modulesLookupTable.delete(name);

        if (removed) {
            ++this.version;
        }
        return removed;
    }

    /**
     * Registers the given module
     * @param module the module to register
     */
    public add(module: ModuleFunctionsRegistry): void {
        ++this.version;
        const freezed = Object.freeze(module);
        this.modulesLookupTable.set(module.fileName, freezed);
    }

    /**
     * Tests if the given module is registered
     * @param name the name of the module
     * @returns {boolean} true if the module is registered
     */
    public has(name: string): boolean {
        return this.modulesLookupTable.has(name);
    }

    /**
     * Returns the module with the given name
     * @param name the file name of the module to lookup
     * @returns the resolved module registry or undefined
     */
    public get(name: string): ModuleFunctionsRegistry | undefined {
        return this.modulesLookupTable.get(name);
    }
}
