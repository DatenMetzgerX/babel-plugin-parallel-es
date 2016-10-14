    slaveFunctionLookupTable.registerStaticFunction({
        identifier: 'static-multiple-environments-case.js#program.body[3].body.body[1].argument.arguments[0]',
        _______isFunctionId: true
    }, function (value) {
        const _environment = arguments[arguments.length - 1];
        return value % _environment.y === 0;
    });
    slaveFunctionLookupTable.registerStaticFunction({
        identifier: 'static-multiple-environments-case.js#program.body[3].body.body[2].argument.callee.object.callee.object.arguments[0]',
        _______isFunctionId: true
    }, function (value) {
        const _environment2 = arguments[arguments.length - 1];
        return value * _environment2.x;
    });