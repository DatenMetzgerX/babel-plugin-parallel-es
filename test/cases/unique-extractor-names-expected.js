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
            identifier: "static:unique-extractor-names-case.js/_entry_anonymous",
            _______isFunctionId: true
        });
    }

    function _environmentExtractor2() {
        return {
            x: x
        };
    }

    const reduced = parallel.from(data).inEnvironment(_environmentExtractor2()).reduce(0, {
        identifier: "static:unique-extractor-names-case.js/_entry_anonymous2",
        _______isFunctionId: true
    }, (memo, value) => memo + x);

    return Promise.all(map(), reduced);
}