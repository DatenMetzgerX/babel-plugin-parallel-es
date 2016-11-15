import parallel from "parallel-es";

const x = 10;

parallel.from([1, 2, 3])
    .inEnvironment(() => ({ y: 2 * x }))
    .map((value, env) => value * env.y);