    /*call-functions-from-outer-scope-case.js*/(function () {
        let defaultOptions;
        function initOptions(option) {
            return Object.assign(option, defaultOptions);
        }
        function _anonymous(option) {
            return initOptions(option);
        }

        function _entry_anonymous() {
            try {
                const _environment = arguments[arguments.length - 1];
                defaultOptions = _environment.defaultOptions;
                return _anonymous.apply(this, arguments);
            } finally {
                defaultOptions = undefined;
            }
        }

        slaveFunctionLookupTable.registerStaticFunction({
            identifier: 'static:call-functions-from-outer-scope-case.js/_entry_anonymous',
            _______isFunctionId: true
        }, _entry_anonymous);
    })();