    /*call-functions-from-nested-outer-scope-case.js*/(function () {
        function _initOptions(option) {
            const _environment = arguments[arguments.length - 1];
            return Object.assign(option, _environment.defaultOptions);
        }
        function _anonymous(option) {
            const _environment = arguments[arguments.length - 1];

            function _initOptionsWrapper() {
                const callee = _initOptions;
                const args = Array.prototype.slice.call(arguments);
                args.length = args.length < callee.length ? callee.length : args.length;
                args.push(_environment);
                return callee.apply(this, args);
            }

            return _initOptionsWrapper(option);
        }

        slaveFunctionLookupTable.registerStaticFunction({
            identifier: 'static:call-functions-from-nested-outer-scope-case.js/_anonymous',
            _______isFunctionId: true
        }, _anonymous);
    })();