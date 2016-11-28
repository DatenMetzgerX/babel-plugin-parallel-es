import parallel from "parallel-es";

function fibonacci(value) {
    if (value <= 2) {
        return 1;
    }
    return fibonacci(value - 1) + fibonacci(value - 2);
}

export function transformData(data) {
    return parallel.from(data).map(fibonacci);
}