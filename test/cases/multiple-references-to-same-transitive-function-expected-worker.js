  /*multiple-references-to-same-transitive-function-case.js*/(function () {
    function double(value) {
      return value + value;
    }
    function _anonymous(value) {
      return double(value) * double(value);
    }

    slaveFunctionLookupTable.registerStaticFunction({
      identifier: 'static:multiple-references-to-same-transitive-function-case.js/_anonymous',
      _______isFunctionId: true
    }, _anonymous);
  })();