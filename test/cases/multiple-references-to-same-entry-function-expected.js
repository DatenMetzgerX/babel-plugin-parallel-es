import parallel from "parallel-es";

function double(value) {
    return value + value;
}

parallel.from([1, 2, 3]).map({
    identifier: "static:multiple-references-to-same-entry-function-case.js/double",
    _______isFunctionId: true
});
parallel.from([1, 2, 3]).map({
    identifier: "static:multiple-references-to-same-entry-function-case.js/double",
    _______isFunctionId: true
});