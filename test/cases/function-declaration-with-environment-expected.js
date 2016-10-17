import parallel from "parallel-es";

const factor = 2;

function _environmentExtractor() {
    return {
        factor: factor
    };
}

function mapper(value) {
    return value * factor;
}

export function transformData(data) {
    return parallel.from(data).inEnvironment(_environmentExtractor()).map({
        identifier: "static:function-declaration-with-environment-case.js/mapper",
        _______isFunctionId: true
    });
}