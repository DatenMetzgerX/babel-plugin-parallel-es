    /*user-defined-and-extracted-environment-case.js*/(function () {
        function _anonymous(value, environment) {
            const _environment = arguments[arguments.length - 1];
            return value * environment.y * _environment.x;
        }

        slaveFunctionLookupTable.registerStaticFunction({
            identifier: 'static:user-defined-and-extracted-environment-case.js/_anonymous',
            _______isFunctionId: true
        }, _anonymous);
    })();