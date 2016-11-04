  /*multiple-environments-case.js*/(function () {
    let y, x;

    function _anonymous(value) {
      return value % y === 0;
    }

    function _entry_anonymous() {
      try {
        const _environment = arguments[arguments.length - 1];
        y = _environment.y;
        return _anonymous.apply(this, arguments);
      } finally {
        y = undefined;
      }
    }

    function _anonymous2(value) {
      return value * x;
    }

    function _entry_anonymous2() {
      try {
        const _environment2 = arguments[arguments.length - 1];
        x = _environment2.x;
        return _anonymous2.apply(this, arguments);
      } finally {
        x = undefined;
      }
    }

    slaveFunctionLookupTable.registerStaticFunction({
      identifier: 'static:multiple-environments-case.js/_entry_anonymous',
      _______isFunctionId: true
    }, _entry_anonymous);
    slaveFunctionLookupTable.registerStaticFunction({
      identifier: 'static:multiple-environments-case.js/_entry_anonymous2',
      _______isFunctionId: true
    }, _entry_anonymous2);
  })();