# babel-plugin-parallel-es
[![Build Status](https://travis-ci.org/DatenMetzgerX/babel-plugin-parallel-es.svg?branch=master)](https://travis-ci.org/DatenMetzgerX/babel-plugin-parallel-es) [![Coverage Status](https://coveralls.io/repos/github/DatenMetzgerX/babel-plugin-parallel-es/badge.svg?branch=master)](https://coveralls.io/github/DatenMetzgerX/babel-plugin-parallel-es?branch=master)

A Babel Plugin that rewrites your [Parallel.ES](https://datenmetzgerx.github.io/parallel.es/) code to add support for debugging your worker code, accessing variables and calling functions from the outer scope from parallel functions. This plugin can be used on a standalone basis, however, it is advised that it is used from a bundler, e.g. with [webpack](https://github.com/DatenMetzgerX/parallel-es-webpack-plugin).

## Architecture
The Plugin actually consists out of two babel plugins:

### Function Extractor Plugin
The function extractor plugin extracts all functions passed to a parallel method. E.g. for the following code:

```js
import parallel from "parallel-es";

const factor = 2;
function mapper(value) {
    return value * factor;
}

export function transformData(data) {
    return parallel.from(data).map(mapper);
}
```

The plugin detects that the mapper function is passed to a parallel method. Therefore it stores a reference to the function declaration of the `mapper` in the `ModulesUsingParallelRegistry`. It then replaces the mapper with a function id that uniquely identifies the function:

```js
import parallel from "parallel-es";

const factor = 2;

function _environmentExtractor() {
    return {
        factor: factor
    };
}

function mapper(value) {
    return value * factor;
}

export function transformData(data) {
    return parallel.from(data).inEnvironment(_environmentExtractor()).map({
        identifier: "static:function-declaration-with-environment-case.js/mapper",
        _______isFunctionId: true
    });
}
```

However, not only the `mapper` function is replaced with a function id, also an additional call to `inEnvironment` is added that extracts the variables used inside the `mapper` (`factor`). 

### Worker Rewriter
This plugin takes the Code of the *parallel-es worker* as input and inserts all of the functions extracted by the function-extractor-plugin into the worker code and registers them. For the example above, the following functions and registrations are inserted into the worker code:

```js
(function () {
	let factor;
	function mapper(value) {
		return value * factor;
	}
	
	function entrymapper() {
		try {
			const _environment = arguments[arguments.length - 1];
			factor = _environment.factor;
			return mapper.apply(this, arguments);
		} finally {
			factor = undefined
		}
	}

	slaveFunctionLookupTable.registerStaticFunction({
		identifier: 'static:function-declaration-with-environment-case.js/entrymapper',
		_______isFunctionId: true
	}, entrymapper);
})();
```

Besides inserting and registrating all the used functions, the worker rewriter also inserts references to all the used imports. However, it only adds import statements and does not include the imported resources into the bundles itself. To do so, a bundler like webpack should be used.

## Test Cases
Test cases showing the expected output can be found in the [test-cases directory](./tree/master/test/cases).
