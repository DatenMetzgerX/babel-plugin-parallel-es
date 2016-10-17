import parallel from "parallel-es";

const defaultOptions = {
    factor: 1
};

function initOptions(option) {
    return Object.assign(option, defaultOptions);
}

parallel.from([{}, {factor: 2}, {}]).map(function (option) {
    return initOptions(option);
});