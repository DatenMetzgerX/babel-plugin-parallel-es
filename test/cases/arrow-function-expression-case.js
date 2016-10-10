import parallel from "parallel-es";

export function transformData(data) {
    return parallel.from(data).map(value => value * 2);
}