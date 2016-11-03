  /*function-expression-case.js*/(function () {
    function _anonymous(value) {
      return value * 2;
    }

    slaveFunctionLookupTable.registerStaticFunction({
      identifier: 'static:function-expression-case.js/_anonymous',
      _______isFunctionId: true
    }, _anonymous);
  })();