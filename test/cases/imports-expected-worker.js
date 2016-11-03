import * as _ from 'lodash';
import { isObject as _isObject } from 'lodash';

/* SPLIT ASSERTION */

  /*imports-case.js*/(function () {
    function mapper(value) {
      if (_isObject(value)) {
        return _.clone(value);
      }return value;
    }slaveFunctionLookupTable.registerStaticFunction({
      identifier: 'static:imports-case.js/mapper',
      _______isFunctionId: true
    }, mapper);
  })();