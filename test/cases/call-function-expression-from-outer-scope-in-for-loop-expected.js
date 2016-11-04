import parallel from "parallel-es";

function transform(data) {
    const upperLimit = 1000;

    const sumUpTo = function (value) {
        let result = 0;
        for (let i = 0; i < value && i < upperLimit; ++i) {
            result += i;
        }

        return result;
    };

    function _environmentExtractor() {
        return {
            upperLimit: upperLimit
        };
    }

    return parallel.from(data).inEnvironment(_environmentExtractor()).map({
        identifier: "static:call-function-expression-from-outer-scope-in-for-loop-case.js/_entry_anonymous",
        _______isFunctionId: true
    });
}

transform([200, 250, 500, 300, 1300]);