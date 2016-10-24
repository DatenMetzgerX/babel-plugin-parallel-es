    (function () {
        function _anonymous2(value) {
            const _environment = arguments[arguments.length - 1];
            let result = 0;for (let i = 0; i < value && i < _environment.upperLimit; ++i) {
                result += i;
            }return result;
        }

        function _anonymous(value) {
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

            const result = [];for (let i = 0; i < value; ++i) {
                result.push(_anonymous2Wrapper(i));
            }return result;
        }

        slaveFunctionLookupTable.registerStaticFunction({
            identifier: 'static:call-function-expression-from-outer-scope-in-for-loop-case.js/_anonymous',
            _______isFunctionId: true
        }, _anonymous);
    })();