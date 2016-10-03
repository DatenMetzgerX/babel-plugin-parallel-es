import * as t from "babel-types";
import {NodePath} from "babel-traverse";
import {IFunctorRegistration} from "./function-registration";
import {RawSourceMap} from "source-map";

/**
 * Registry that stores the functions for a single module
 */
export class ModuleFunctionsRegistry {
    private functionsRegistry = new Map<string, IFunctorRegistration>();

    /**
     * Returns the functors passed to parallel
     * @returns the functors
     */
    public get functions() {
        return Array.from(this.functionsRegistry.values());
    }

    /**
     * Indicator if the module passes any functors to parallel
     * @returns {boolean} true if the module does never pass a functor to parallel
     */
    public get empty() {
        return this.functionsRegistry.size === 0;
    }

    constructor(public fileName: string, public map?: RawSourceMap) {
    }

    /**
     * Registers a new function
     * @param path the path of the function
     * @returns the created registration
     */
    public registerFunction(path: NodePath<t.Function>): IFunctorRegistration {
        path.assertFunction();

        const key = path.getPathLocation();
        let registration = this.functionsRegistry.get(key);
        if (!registration) {
            registration = { identifier: `static-${this.fileName}#${key}`, node: path.node };
            this.functionsRegistry.set(key, registration);
        }

        return registration;
    }
}
