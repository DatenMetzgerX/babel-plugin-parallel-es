import * as t from "babel-types";
import {Scope, NodePath} from "babel-traverse";
import {ModuleFunctionsRegistry} from "../module-functions-registry";

export interface ITranspileParallelFunctorState {
    readonly accessedVariables: string[];
    hasEnvironment: boolean;
    readonly module: ModuleFunctionsRegistry;
    readonly originalFunctor: NodePath<t.Function>;
    readonly scope: Scope;
    readonly usesEnvironment: boolean;

    addAccessedVariable(name: string): void;
}

export class TranspileParallelFunctorState implements ITranspileParallelFunctorState {
    public hasEnvironment = false;
    public get scope(): Scope {
        return this.originalFunctor.scope;
    }

    public get usesEnvironment(): boolean {
        return this.accessedVariablesSet.size > 0 && this.hasEnvironment;
    }

    public get accessedVariables(): string[] {
        return Array.from(this.accessedVariablesSet.values());
    };

    private accessedVariablesSet = new Set<string>();

    constructor(public readonly originalFunctor: NodePath<t.Function>, public readonly module: ModuleFunctionsRegistry) {

    }

    public addAccessedVariable(name: string): void {
        if (!this.hasEnvironment) {
            throw new Error("This state has no environment and therefore no variables can be added");
        }

        this.accessedVariablesSet.add(name);
    }
}

export class TranspileParallelFunctorChildState implements ITranspileParallelFunctorState {
    private accessedVariablesSet = new Set<string>();

    public get accessedVariables(): string[] {
        return Array.from(this.accessedVariablesSet.values());
    }

    public get module(): ModuleFunctionsRegistry {
        return this.parent.module;
    }

    public get scope(): Scope {
        return this.originalFunctor.scope;
    }

    public get usesEnvironment(): boolean {
        return this.accessedVariablesSet.size > 0 && this.hasEnvironment;
    }

    public get hasEnvironment(): boolean {
        return this.parent.hasEnvironment;
    }

    constructor(public originalFunctor: NodePath<t.Function>, private parent: ITranspileParallelFunctorState) {

    }

    public addAccessedVariable(name: string): void {
        this.accessedVariablesSet.add(name);
        this.parent.addAccessedVariable(name);
    }
}
