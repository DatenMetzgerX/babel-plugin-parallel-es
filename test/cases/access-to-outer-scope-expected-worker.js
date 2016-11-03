  /*access-to-outer-scope-case.js*/(function () {
    function _anonymous(value) {
      const _environment = arguments[arguments.length - 1];
      return value * _environment.x;
    }

    slaveFunctionLookupTable.registerStaticFunction({
      identifier: 'static:access-to-outer-scope-case.js/_anonymous',
      _______isFunctionId: true
    }, _anonymous);
  })();