import parallel from "parallel-es";

function test() {
    var x = 10;

    parallel.from([1, 2, 3]).map(function withDefinedX(value) {
        return value * x;
    });
}

parallel.from([1, 2, 3]).map(function withUndefinedX(value) {
        return value * x; // x is not defined, error expected
    }
);

