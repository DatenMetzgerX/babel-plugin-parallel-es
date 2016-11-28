    /*recursive-function-case.js*/(function () {
        function fibonacci(value) {
            if (value <= 2) {
                return 1;
            }return fibonacci(value - 1) + fibonacci(value - 2);
        }slaveFunctionLookupTable.registerStaticFunction({
            identifier: 'static:recursive-function-case.js/fibonacci',
            _______isFunctionId: true
        }, fibonacci);
    })();