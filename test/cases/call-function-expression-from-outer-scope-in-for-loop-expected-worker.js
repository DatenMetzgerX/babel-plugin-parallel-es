  (function () {
    let upperLimit;

    function _anonymous2(value) {
      let result = 0;for (let i = 0; i < value && i < upperLimit; ++i) {
        result += i;
      }return result;
    }

    function _anonymous(value) {
      const result = [];for (let i = 0; i < value; ++i) {
        result.push(_anonymous2(i));
      }return result;
    }

    function _entry_anonymous() {
      try {
        const _environment = arguments[arguments.length - 1];
        upperLimit = _environment.upperLimit;
        return _anonymous.apply(this, arguments);
      } finally {
        upperLimit = undefined;
      }
    }

    slaveFunctionLookupTable.registerStaticFunction({
      identifier: 'static:call-function-expression-from-outer-scope-in-for-loop-case.js/_entry_anonymous',
      _______isFunctionId: true
    }, _entry_anonymous);
  })();