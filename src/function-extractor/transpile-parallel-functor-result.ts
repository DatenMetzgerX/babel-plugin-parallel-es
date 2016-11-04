import {FunctionDeclaration} from "babel-types";

/**
 * Reslult of a transpiled functor
 */
export interface ITranspileParallelFunctorResult {
    /**
     * Variables accessed from the functor that are defined outside from the functor. These variables
     * must be made available in the environment variable with the name {@code environmentVariable}
     */
    environmentVariables: string[];

    /**
     * The transpiled functor
     */
    transpiledFunctor: FunctionDeclaration;
}
