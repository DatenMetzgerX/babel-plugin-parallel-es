import parallel from "parallel-es";

const defaultOptions = {
    factor: 1
};

function initOptions(option) {
    return Object.assign(option, defaultOptions);
}

function _environmentExtractor() {
    return {
        defaultOptions: defaultOptions
    };
}

parallel.from([{}, { factor: 2 }, {}]).inEnvironment(_environmentExtractor()).map({
    identifier: "static:call-functions-from-outer-scope-case.js/_anonymous",
    _______isFunctionId: true
});