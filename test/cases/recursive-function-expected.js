import parallel from "parallel-es";

const terminalValue = 1;

function fibonacci(value) {
    if (value <= 2) {
        return terminalValue;
    }
    return fibonacci(value - 1) + fibonacci(value - 2);
}

export function transformData(data) {
    function _environmentExtractor() {
        return {
            terminalValue: terminalValue
        };
    }

    return parallel.from(data).inEnvironment(_environmentExtractor()).map({
        identifier: "static:recursive-function-case.js/_entry_anonymous",
        _______isFunctionId: true
    });
}