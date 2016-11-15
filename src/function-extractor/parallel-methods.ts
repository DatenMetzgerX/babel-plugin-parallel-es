export type ParallelMethod = IParallelFunctionCall | IParallelFunctor;

/**
 * A functor that is passed to a parallel function
 */
export interface IParallelFunctor {
    functor: boolean;

    /**
     * Does the argument also allow non functor arguments?
     */
    allowNonFunctions?: boolean;

    /**
     * Whats the index of the functor argument
     */
    functorArgumentIndex: number;
}

/**
 * Function call to a parallel function. A function call differs from a plain functor as it also defines the arguments passed
 * to the functor.
 */
export interface IParallelFunctionCall {
    functionCall: true;
    allowNonFunctions?: boolean;
    functorArgumentIndex: number;
}

export function isParallelFunctionCall(object: any): object is IParallelFunctionCall {
    return !!object && object.functionCall === true;
}

export function isParallelFunctor(object: any): object is IParallelFunctor {
    return !!object && object.functor === true;
}

export const PARALLEL_METHODS: { [name: string]: IParallelFunctor | IParallelFunctionCall } = {
    filter: { functor: true, functorArgumentIndex: 0 },
    inEnvironment: { allowNonFunctions: true, functionCall: true, functor: true, functorArgumentIndex: 0 },
    map: { functor: true, functorArgumentIndex: 0 },
    reduce: { functor: true, functorArgumentIndex: 1 },
    schedule: { allowNonFunctions: true, functionCall: true, functorArgumentIndex: 0 },
    times: { allowNonFunctions: true, functor: true, functorArgumentIndex: 1 }
};
