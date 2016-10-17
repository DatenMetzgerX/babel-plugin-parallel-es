    /*call-functions-from-outer-scope-without-environment-case.js*/(function () {
        function toObject(value) {
            if (typeof value === "object") {
                return value;
            }return { value: value };
        }
        function _anonymous(value) {
            const _environment = arguments[arguments.length - 1];
            return _environment.factor * toObject(value).value;
        }

        slaveFunctionLookupTable.registerStaticFunction({
            identifier: 'static:call-functions-from-outer-scope-without-environment-case.js/_anonymous',
            _______isFunctionId: true
        }, _anonymous);
    })();

