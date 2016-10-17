import parallel from "parallel-es";
import * as _ from "lodash";
import {isObject} from "lodash";

function mapper(value) {
    if (isObject(value)) {
        return _.clone(value);
    }

    return value;
}

export function transformData(data) {
    return parallel.from(data).map(mapper);
}