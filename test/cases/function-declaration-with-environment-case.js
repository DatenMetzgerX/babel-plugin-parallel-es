import parallel from "parallel-es";

const factor = 2;
function mapper(value) {
    return value * factor;
}

export function transformData(data) {
    return parallel.from(data).map(mapper);
}