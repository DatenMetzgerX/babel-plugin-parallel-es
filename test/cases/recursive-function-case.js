import parallel from "parallel-es";

const terminalValue = 1;

function fibonacci(value) {
    if (value <= 2) {
        return terminalValue;
    }
    return fibonacci(value - 1) + fibonacci(value - 2);
}

export function transformData(data) {
    return parallel.from(data).map(function (value) {
        return fibonacci(value);
    });
}