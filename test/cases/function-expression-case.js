import parallel from "parallel-es";

export function transformData(data) {
    return parallel.from(data).map(function (value) {
        return value * 2;
    });
}