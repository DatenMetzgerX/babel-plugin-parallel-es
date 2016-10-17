import parallel from "parallel-es";

export function transformData(data) {
    return parallel.from(data).map({
        identifier: "static:arrow-function-expression-case.js/_anonymous",
        _______isFunctionId: true
    });
}