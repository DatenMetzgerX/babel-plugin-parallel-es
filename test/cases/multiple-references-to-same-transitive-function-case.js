import parallel from "parallel-es";

function double(value) {
    return value + value;
}

parallel.from([1, 2, 3]).map(function (value) {
    return double(value) * double(value);
});