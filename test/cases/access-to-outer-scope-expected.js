import parallel from "parallel-es";

const x = 10;

function transformData(data) {
    function _environmentExtractor() {
        return {
            x: x
        };
    }

    return parallel.from(data).inEnvironment(_environmentExtractor()).map({
        identifier: "static:access-to-outer-scope-case.js/_anonymous",
        _______isFunctionId: true
    });
}