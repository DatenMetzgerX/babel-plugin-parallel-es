    /*function-declaration-with-environment-case.js*/(function () {
        function mapper(value) {
            const _environment = arguments[arguments.length - 1];
            return value * _environment.factor;
        }slaveFunctionLookupTable.registerStaticFunction({
            identifier: 'static:function-declaration-with-environment-case.js/mapper',
            _______isFunctionId: true
        }, mapper);
    })();