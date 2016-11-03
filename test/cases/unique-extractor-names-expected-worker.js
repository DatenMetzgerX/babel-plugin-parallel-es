  /*unique-extractor-names-case.js*/(function () {
    function _anonymous(value) {
      const _environment = arguments[arguments.length - 1];
      return value * _environment.x;
    }

    function _anonymous2(memo, value) {
      const _environment2 = arguments[arguments.length - 1];
      return memo + _environment2.x;
    }

    slaveFunctionLookupTable.registerStaticFunction({
      identifier: 'static:unique-extractor-names-case.js/_anonymous',
      _______isFunctionId: true
    }, _anonymous);
    slaveFunctionLookupTable.registerStaticFunction({
      identifier: 'static:unique-extractor-names-case.js/_anonymous2',
      _______isFunctionId: true
    }, _anonymous2);
  })();