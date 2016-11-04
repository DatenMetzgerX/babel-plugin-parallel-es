  /*user-defined-and-extracted-environment-case.js*/(function () {
    let x;

    function _anonymous(value, environment) {
      return value * environment.y * x;
    }

    function _entry_anonymous() {
      try {
        const _environment = arguments[arguments.length - 1];
        x = _environment.x;
        return _anonymous.apply(this, arguments);
      } finally {
        x = undefined;
      }
    }

    slaveFunctionLookupTable.registerStaticFunction({
      identifier: 'static:user-defined-and-extracted-environment-case.js/_entry_anonymous',
      _______isFunctionId: true
    }, _entry_anonymous);
  })();