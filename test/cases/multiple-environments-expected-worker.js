  /*multiple-environments-case.js*/(function () {
    function _anonymous(value) {
      const _environment = arguments[arguments.length - 1];
      return value % _environment.y === 0;
    }

    function _anonymous2(value) {
      const _environment2 = arguments[arguments.length - 1];
      return value * _environment2.x;
    }

    slaveFunctionLookupTable.registerStaticFunction({
      identifier: 'static:multiple-environments-case.js/_anonymous',
      _______isFunctionId: true
    }, _anonymous);
    slaveFunctionLookupTable.registerStaticFunction({
      identifier: 'static:multiple-environments-case.js/_anonymous2',
      _______isFunctionId: true
    }, _anonymous2);
  })();