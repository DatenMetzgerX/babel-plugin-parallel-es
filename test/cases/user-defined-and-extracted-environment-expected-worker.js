    slaveFunctionLookupTable.registerStaticFunction({
        identifier: 'static-user-defined-and-extracted-environment-case.js#program.body[2].body.body[1].argument.callee.object.arguments[0]',
        _______isFunctionId: true
    }, function (value, environment) {
        const _environment = arguments[arguments.length - 1];
        return value * environment.y * _environment.x;
    });