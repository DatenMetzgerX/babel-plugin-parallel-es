import parallel from "parallel-es";

const x = 10;

function transformData(data) {
    return parallel.from(data).map(function (value, environment) {
        return value * environment.y * x;
    }).inEnvironment({ y: 11 });
}
