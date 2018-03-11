  /*unique-extractor-names-case.js*/(function () {
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

    function _anonymous2(memo, value) {
      return memo + x;
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
      identifier: "static:unique-extractor-names-case.js/_entry_anonymous",
      _______isFunctionId: true
    }, _entry_anonymous);
    slaveFunctionLookupTable.registerStaticFunction({
      identifier: "static:unique-extractor-names-case.js/_entry_anonymous2",
      _______isFunctionId: true
    }, _entry_anonymous2);
  })();