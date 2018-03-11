import * as _2 from "lodash";
import { isObject as _isObject } from "lodash";

/* SPLIT ASSERTION */

  /*imports-case.js*/(function () {
    function mapper(value) {
      if (_isObject(value)) {
        return _2.clone(value);
      }return value;
    }slaveFunctionLookupTable.registerStaticFunction({
      identifier: "static:imports-case.js/mapper",
      _______isFunctionId: true
    }, mapper);
  })();