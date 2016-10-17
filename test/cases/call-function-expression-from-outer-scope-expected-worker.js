    /*call-function-expression-from-outer-scope-case.js*/(function () {
        function _anonymous2(option) {
            const _environment = arguments[arguments.length - 1];
            return Object.assign(option, _environment.defaultOptions);
        }

        function _anonymous(option) {
            const _environment = arguments[arguments.length - 1];

            function _anonymous2Wrapper() {
                const callee = _anonymous2;
                const args = Array.prototype.slice.call(arguments);
                args.length = args.length < callee.length ? callee.length : args.length;
                args.push(_environment);
                return callee.apply(this, args);
            }

            return _anonymous2Wrapper(option);
        }

        slaveFunctionLookupTable.registerStaticFunction({
            identifier: 'static:call-function-expression-from-outer-scope-case.js/_anonymous',
            _______isFunctionId: true
        }, _anonymous);
    })();