import parallel from "parallel-es";

const x = 10;

function transformData(data) {
    return parallel.from(data).map(function (value) {
        return value * x;
    });
}
