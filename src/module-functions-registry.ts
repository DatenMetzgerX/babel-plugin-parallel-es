import {NodePath} from "babel-traverse";
import {IFunctionRegistration, FunctionNode} from "./function-registration";
/**
 * Registry that stores the functions for a single module
 */
export class ModuleFunctionsRegistry {
    private functionsRegistry = new Map<string, IFunctionRegistration>();

    public get functions() {
        return Array.from(this.functionsRegistry.values());
    }

    public get empty() {
        return this.functionsRegistry.size === 0;
    }

    constructor(public fileName: string, public code: string, public map?: Object) {
    }

    public registerFunction(path: NodePath<FunctionNode>) {
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
