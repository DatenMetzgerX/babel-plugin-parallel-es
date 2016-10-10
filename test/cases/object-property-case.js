import parallel from "parallel-es";

const transformer = {
    x: 10,

    mapper: function(value) {
        return value * 2;
    }
};

parallel.from([1, 2, 3]).map(transformer.mapper);