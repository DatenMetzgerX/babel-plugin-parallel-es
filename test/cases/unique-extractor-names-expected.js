import parallel from "parallel-es";

const x = 10;

function transformData(data) {
    function map() {
        function _environmentExtractor() {
            return {
                x: x
            };
        }

        return parallel.from(data).inEnvironment(_environmentExtractor()).map({
            identifier: "static-unique-extractor-names-case.js#program.body[2].body.body[0].body.body[1].argument.arguments[0]",
            _______isFunctionId: true
        });
    }

    function _environmentExtractor2() {
        return {
            x: x
        };
    }

    const reduced = parallel.from(data).inEnvironment(_environmentExtractor2()).reduce(0, {
        identifier: "static-unique-extractor-names-case.js#program.body[2].body.body[2].declarations[0].init.arguments[1]",
        _______isFunctionId: true
    }, function (memo, value) {
        const _environment2 = arguments[arguments.length - 1];
        return memo + _environment2.x;
    });

    return Promise.all(map(), reduced);
}