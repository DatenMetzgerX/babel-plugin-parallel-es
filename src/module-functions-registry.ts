import {NodePath} from "babel-traverse";
import {FunctionNode, IFunctionRegistration} from "./static-function-registry";
/**
 * Registry that stores the functions for a single module
 */
export class ModuleFunctionsRegistry {
    private functionsRegistry = new Map<string, IFunctionRegistration>();

    get functions() {
        return Array.from(this.functionsRegistry.values());
    }

    get empty() {
        return this.functionsRegistry.size === 0;
    }

    constructor(public fileName: string, public code: string, public map?: Object) {
    }

    registerFunction(path: NodePath<FunctionNode>) {
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