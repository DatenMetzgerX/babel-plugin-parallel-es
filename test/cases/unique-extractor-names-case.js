import parallel from "parallel-es";

const x = 10;

function transformData(data) {
    function map() {
        return parallel.from(data).map(function (value) {
            return value * x;
        });
    }
    
    const reduced = parallel.from(data).reduce(0, (memo, value) => memo + x);

    return Promise.all(map(), reduced);
}
