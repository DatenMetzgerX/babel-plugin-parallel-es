import parallel from "parallel-es";

const transformer = {
    x: 10,

    mapper: function (value) {
        return value * 2;
    }
};

parallel.from([1, 2, 3]).map({
    identifier: "static-object-property-case.js#program.body[1].declarations[0].init.properties[1].value",
    _______isFunctionId: true
});