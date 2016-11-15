import parallel from "parallel-es";

const x = 10;

function _environmentExtractor() {
    return {
        x: x
    };
}

parallel.from([1, 2, 3]).inEnvironment(_environmentExtractor()).inEnvironment({
    functionId: {
        identifier: "static:in-environment-case.js/_entry_anonymous",
        _______isFunctionId: true
    },
    parameters: [],
    ______serializedFunctionCall: true
}).map({
    identifier: "static:in-environment-case.js/_anonymous",
    _______isFunctionId: true
});