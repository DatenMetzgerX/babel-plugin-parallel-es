    /*call-functions-from-outer-scope-without-environment-case.js*/(function () {
        let factor;
        function toObject(value) {
            if (typeof value === "object") {
                return value;
            }return { value: value };
        }
        function _anonymous(value) {
            return factor * toObject(value).value;
        }

        function _entry_anonymous() {
            try {
                const _environment = arguments[arguments.length - 1];
                factor = _environment.factor;
                return _anonymous.apply(this, arguments);
            } finally {
                factor = undefined;
            }
        }

        slaveFunctionLookupTable.registerStaticFunction({
            identifier: 'static:call-functions-from-outer-scope-without-environment-case.js/_entry_anonymous',
            _______isFunctionId: true
        }, _entry_anonymous);
    })();

