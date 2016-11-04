import parallel from "parallel-es";

function toObject(value) {
    if (typeof value === "object") {
        return value;
    }

    return { value: value };
}

const factor = 2;

function _environmentExtractor() {
    return {
        factor: factor
    };
}

parallel.from([2, { value: 2 }, 3]).inEnvironment(_environmentExtractor()).map({
    identifier: "static:call-functions-from-outer-scope-without-environment-case.js/_entry_anonymous",
    _______isFunctionId: true
});