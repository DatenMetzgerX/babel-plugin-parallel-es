import parallel from "parallel-es";

function transform(data) {
    const defaultOptions = {
        factor: 1
    };

    function initOptions (option) {
        return Object.assign(option, defaultOptions);
    }

    return parallel.from(data).map(function (option) {
        return initOptions(option);
    });
}

transform([{}, { factor: 2}]);