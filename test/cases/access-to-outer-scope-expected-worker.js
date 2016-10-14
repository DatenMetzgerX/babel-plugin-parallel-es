    slaveFunctionLookupTable.registerStaticFunction({
        identifier: 'static-access-to-outer-scope-case.js#program.body[2].body.body[1].argument.arguments[0]',
        _______isFunctionId: true
    }, function (value) {
        const _environment = arguments[arguments.length - 1];
        return value * _environment.x;
    });