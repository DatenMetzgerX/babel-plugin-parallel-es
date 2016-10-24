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

    return parallel.from(data).map(function (value) {
        const result = [];
        for (let i = 0; i < value; ++i) {
            result.push(sumUpTo(i));
        }
        return result;
    });
}

transform([200, 250, 500, 300, 1300]);