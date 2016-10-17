import parallel from "parallel-es";

const x = 10;
const y = 2;

function transformData(data) {
    function _environmentExtractor() {
        return {
            y: y
        };
    }

    function _environmentExtractor2() {
        return {
            x: x
        };
    }

    return parallel.from(data).inEnvironment(_environmentExtractor2()).map({
        identifier: "static:multiple-environments-case.js/_anonymous2",
        _______isFunctionId: true
    }).inEnvironment(_environmentExtractor()).filter({
        identifier: "static:multiple-environments-case.js/_anonymous",
        _______isFunctionId: true
    });
}