  /*multiple-references-to-same-entry-function-case.js*/(function () {
    function double(value) {
      return value + value;
    }slaveFunctionLookupTable.registerStaticFunction({
      identifier: 'static:multiple-references-to-same-entry-function-case.js/double',
      _______isFunctionId: true
    }, double);
  })();