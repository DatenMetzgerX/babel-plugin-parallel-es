  /*call-function-expression-from-outer-scope-case.js*/(function () {
    function _anonymous2(option) {
      const _environment = arguments[arguments.length - 1];
      return Object.assign(option, _environment.defaultOptions);
    }

    function _anonymous(option) {
      const _environment = arguments[arguments.length - 1];

      function _anonymous2Wrapper() {
        "use strict";

        var callee = _anonymous2;
        var $_args_len = arguments.length;
        var $_len = ($_args_len < callee.length ? callee.length : $_args_len) + 1;
        var args = new Array($_len);

        for (var $_i = 0; $_i < $_args_len; ++$_i) {
          args[$_i] = arguments[$_i];
        }

        args[$_len - 1] = _environment;
        return callee.apply(this, args);
      }

      return _anonymous2Wrapper(option);
    }

    slaveFunctionLookupTable.registerStaticFunction({
      identifier: 'static:call-function-expression-from-outer-scope-case.js/_anonymous',
      _______isFunctionId: true
    }, _anonymous);
  })();