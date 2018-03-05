  /*recursive-function-case.js*/(function () {
    let terminalValue;
    function fibonacci(value) {
      if (value <= 2) {
        return terminalValue;
      }return fibonacci(value - 1) + fibonacci(value - 2);
    }
    function _anonymous(value) {
      return fibonacci(value);
    }

    function _entry_anonymous() {
      try {
        const _environment = arguments[arguments.length - 1];
        terminalValue = _environment.terminalValue;
        return _anonymous.apply(this, arguments);
      } finally {
        terminalValue = undefined;
      }
    }

    slaveFunctionLookupTable.registerStaticFunction({
      identifier: "static:recursive-function-case.js/_entry_anonymous",
      _______isFunctionId: true
    }, _entry_anonymous);
  })();