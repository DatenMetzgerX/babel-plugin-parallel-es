  /*function-declaration-with-environment-case.js*/(function () {
    let factor;
    function mapper(value) {
      return value * factor;
    }
    function _entrymapper() {
      try {
        const _environment = arguments[arguments.length - 1];
        factor = _environment.factor;
        return mapper.apply(this, arguments);
      } finally {
        factor = undefined;
      }
    }

    slaveFunctionLookupTable.registerStaticFunction({
      identifier: 'static:function-declaration-with-environment-case.js/_entrymapper',
      _______isFunctionId: true
    }, _entrymapper);
  })();