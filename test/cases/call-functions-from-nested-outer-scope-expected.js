import parallel from "parallel-es";

function transform(data) {
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

    parallel.from(data).inEnvironment(_environmentExtractor()).map({
        identifier: "static:call-functions-from-nested-outer-scope-case.js/_anonymous",
        _______isFunctionId: true
    });
}

transform([{}, { factor: 2 }]);