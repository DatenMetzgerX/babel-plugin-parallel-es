  /*in-environment-case.js*/(function () {
    let x;

    function _anonymous(value, env) {
      return value * env.y;
    }

    function _anonymous2() {
      return { y: 2 * x };
    }

    function _entry_anonymous() {
      try {
        const _environment = arguments[arguments.length - 1];
        x = _environment.x;
        return _anonymous2.apply(this, arguments);
      } finally {
        x = undefined;
      }
    }

    slaveFunctionLookupTable.registerStaticFunction({
      identifier: "static:in-environment-case.js/_anonymous",
      _______isFunctionId: true
    }, _anonymous);
    slaveFunctionLookupTable.registerStaticFunction({
      identifier: "static:in-environment-case.js/_entry_anonymous",
      _______isFunctionId: true
    }, _entry_anonymous);
  })();