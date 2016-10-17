import parallel from "parallel-es";

function transform(data) {
    const defaultOptions = {
        factor: 1
    };

    const initOptions = function (option) {
        return Object.assign(option, defaultOptions);
    };

    function _environmentExtractor() {
        return {
            defaultOptions: defaultOptions
        };
    }

    return parallel.from(data).inEnvironment(_environmentExtractor()).map({
        identifier: "static:call-function-expression-from-outer-scope-case.js/_anonymous",
        _______isFunctionId: true
    });
}

transform([{}, { factor: 2 }]);