import parallel from "parallel-es";

function mapper(value) {
    return value * 2;
}

export function transformData(data) {
    return parallel.from(data).map({
        identifier: "static:function-declaration-case.js/mapper",
        _______isFunctionId: true
    });
}