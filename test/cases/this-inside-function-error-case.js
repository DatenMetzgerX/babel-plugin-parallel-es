import parallel from "parallel-es";

parallel.from([1, 2, 3]).map(function (value) {
    this.count = this.count || 0;
    return this.count++ * value;
});