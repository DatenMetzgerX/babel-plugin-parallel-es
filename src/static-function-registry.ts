import * as t from "babel-types";
import {NodePath} from "babel-traverse";

export type FunctionNode = t.FunctionExpression | t.FunctionDeclaration | t.ArrowFunctionExpression;

export interface IFunctionRegistration {
    identifier: string,
    node: FunctionNode
}

/**
 * Registry that stores the functions for a single module
 */
export class ModuleFunctionsRegistry {
    private functions = new Map<string, IFunctionRegistration>();
    constructor(public fileName: string, public code: string) {
    }

    registerFunction(path: NodePath<FunctionNode>) {
        const key = path.getPathLocation();
        let registration = this.functions.get(key);
        if (!registration) {
            registration = { identifier: `static-${this.fileName}#${key}`, node: path.node };
            this.functions.set(key, registration);
        }

        return registration;
    }

    public getFunctions() {
        return Array.from(this.functions.values());
    }
}

export class StaticFunctionRegistry {
    private functions = new Map<string, ModuleFunctionsRegistry>();

    constructor() {}

    registerStaticFunction(functionPath: NodePath<FunctionNode>) : IFunctionRegistration {
        functionPath.assertFunction();

        const module = this.getModule(functionPath);
        return module.registerFunction(functionPath);
    }

    private getModule(path: NodePath<any>) {
        const filename = path.hub.file.opts.filename;
        let map = this.functions.get(filename);
        if (!map) {
            map = new ModuleFunctionsRegistry(filename, path.hub.file.code);
            this.functions.set(filename, map);
        }
        return map;
    }

    getFunctions() {
        return Array.from(this.functions.values()).map(module => ({
            filename: module.fileName,
            code: module.code,
            functions: module.getFunctions()
        }));
    }
}
