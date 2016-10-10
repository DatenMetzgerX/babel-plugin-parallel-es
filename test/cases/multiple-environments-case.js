import parallel from "parallel-es";

const x = 10;
const y = 2;

function transformData(data) {
    return parallel.from(data)
        .map(function (value) {
            return value * x;
        })
        .filter(function (value) {
            return value % y === 0;
        });
}
