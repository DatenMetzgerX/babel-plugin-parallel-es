  /*access-to-outer-scope-case.js*/(function () {
    let x;

    function _anonymous(value) {
      return value * x;
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
      identifier: 'static:access-to-outer-scope-case.js/_entry_anonymous',
      _______isFunctionId: true
    }, _entry_anonymous);
  })();