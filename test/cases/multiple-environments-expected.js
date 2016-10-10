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
        identifier: "static-multiple-environments-case.js#program.body[3].body.body[2].argument.callee.object.callee.object.arguments[0]",
        _______isFunctionId: true
    }).inEnvironment(_environmentExtractor()).filter({
        identifier: "static-multiple-environments-case.js#program.body[3].body.body[1].argument.arguments[0]",
        _______isFunctionId: true
    });
}