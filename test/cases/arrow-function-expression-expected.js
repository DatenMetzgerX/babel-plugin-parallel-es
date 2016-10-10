import parallel from "parallel-es";

export function transformData(data) {
    return parallel.from(data).map({
        identifier: "static-arrow-function-expression-case.js#program.body[1].declaration.body.body[0].argument.arguments[0]",
        _______isFunctionId: true
    });
}