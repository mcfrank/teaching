digamma
===
[![NPM version][npm-image]][npm-url] [![Build Status][travis-image]][travis-url] [![Coverage Status][codecov-image]][codecov-url] [![Dependencies][dependencies-image]][dependencies-url]

> Computes the [digamma function](https://en.wikipedia.org/wiki/Digamma_function).

The [digamma function](https://en.wikipedia.org/wiki/Digamma_function) `ψ` is the logarithmic derivative of the [gamma function](https://en.wikipedia.org/wiki/Gamma_function), i.e.

<div class="equation" align="center" data-raw-text="\psi(x) =\frac{d}{dx} \ln{\Gamma(x)}= \frac{\Gamma\,'(x)}{\Gamma(x)}. " data-equation="eq:digamma_function">
	<img src="https://cdn.rawgit.com/compute-io/digamma/f45b8572ebf552ca7e55d0ce0ab3a485e6b8cbe5/docs/img/eqn.svg" alt="Equation of the digamma function.">
	<br>
</div>


## Installation

``` bash
$ npm install compute-digamma
```

For use in the browser, use [browserify](https://github.com/substack/node-browserify).


## Usage

``` javascript
var digamma = require( 'compute-digamma' );
```


#### digamma( x[, options] )

Evaluates the [digamma function](https://en.wikipedia.org/wiki/Digamma_function) (element-wise). `x` may be either a [`number`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number), an [`array`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array), a [`typed array`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Typed_arrays), or a [`matrix`](https://github.com/dstructs/matrix).

``` javascript
var matrix = require( 'dstructs-matrix' ),
	data,
	mat,
	out,
	i;

out = digamma( -1 );
// returns NaN

out = digamma( [ -2.5, -1, 0, 1, 10 ] );
// returns [ ~1.103, NaN, NaN, ~-0.577, ~2.252 ]

data = [ 0, 1, 2 ];
out = digamma( data );
// returns [ NaN, ~-0.5772, ~0.423 ]

data = new Int8Array( data );
out = digamma( data );
// returns Float64Array( [NaN,~-0.577,~0.423] )

data = new Float64Array( 6 );
for ( i = 0; i < 6; i++ ) {
	data[ i ] = i / 2;
}
mat = matrix( data, [3,2], 'float64' );
/*
	[ 0  0.5
	  1  1.5
	  2  2.5 ]
*/

out = digamma( mat );
/*
	[ NaN ~-1.964
	  ~-0.577 ~0.036
	  ~0.423 ~0.703 ]
*/

```

The function accepts the following `options`:

* 	__accessor__: accessor `function` for accessing `array` values.
* 	__dtype__: output [`typed array`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Typed_arrays) or [`matrix`](https://github.com/dstructs/matrix) data type. Default: `float64`.
*	__copy__: `boolean` indicating if the `function` should return a new data structure. Default: `true`.
*	__path__: [deepget](https://github.com/kgryte/utils-deep-get)/[deepset](https://github.com/kgryte/utils-deep-set) key path.
*	__sep__: [deepget](https://github.com/kgryte/utils-deep-get)/[deepset](https://github.com/kgryte/utils-deep-set) key path separator. Default: `'.'`.

For non-numeric `arrays`, provide an accessor `function` for accessing `array` values.

``` javascript
var data = [
	['beep', -2.5],
	['boop', -1],
	['bip', 0],
	['bap', 1],
	['baz', 10]
];

function getValue( d, i ) {
	return d[ 1 ];
}

var out = digamma( data, {
	'accessor': getValue
});
// returns [ ~1.103, NaN, NaN, ~-0.577, ~2.252 ]

```

To [deepset](https://github.com/kgryte/utils-deep-set) an object `array`, provide a key path and, optionally, a key path separator.

``` javascript
var data = [
	{'x':[0,-2.5]},
	{'x':[1,-1]},
	{'x':[2,0]},
	{'x':[3,1]},
	{'x':[4,10]}
];

var out = digamma( data, {
	'path': 'x|1',
	'sep': '|'
});
/*
    [
        {'x':[0,~1.103]},
        {'x':[1,NaN]},
        {'x':[2,NaN]},
        {'x':[3,~-0.577]},
        {'x':[4,~2.252]}
    ]
*/

var bool = ( data === out );
// returns true

```

By default, when provided a [`typed array`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Typed_arrays) or [`matrix`](https://github.com/dstructs/matrix), the output data structure is `float64` in order to preserve precision. To specify a different data type, set the `dtype` option (see [`matrix`](https://github.com/dstructs/matrix) for a list of acceptable data types).

``` javascript
var data, out;

data = new Int8Array( [0, 1, 2] );

out = digamma( data, {
	'dtype': 'int32'
});
// returns Int32Array( [0,0,0] )

// Works for plain arrays, as well...
out = digamma( [0, 1, 2], {
	'dtype': 'uint8'
});
// returns Uint8Array( [0,0,0] )

```

By default, the function returns a new data structure. To mutate the input data structure (e.g., when input values can be discarded or when optimizing memory usage), set the `copy` option to `false`.

``` javascript
var data,
	bool,
	mat,
	out,
	i;

var data = [ -2.5, -1, 0, 1, 10 ];

var out = digamma( data, {
	'copy': false
});
// returns [ ~1.103, NaN, NaN, ~-0.577,~ 2.252 ]

bool = ( data === out );
// returns true

data = new Float64Array( 6 );
for ( i = 0; i < 6; i++ ) {
	data[ i ] = i / 2;
}
mat = matrix( data, [3,2], 'float64' );
/*
	[ 0  0.5
	  1  1.5
	  2  2.5 ]
*/

out = digamma( mat, {
	'copy': false
});
/*
	[ NaN ~-1.964
	  ~-0.577 ~0.036
	  ~0.423 ~0.703 ]
*/

bool = ( mat === out );
// returns true

```

## Implementation

The function has been adapted from the implementation found in the Boost C++ library. See the Boost [documentation](http://www.boost.org/doc/libs/1_53_0/libs/math/doc/sf_and_dist/html/math_toolkit/special/sf_gamma/digamma.html#math_toolkit.special.sf_gamma.digamma.implementation) about implementation details. Only the necessary parts for 17 significant digits were translated, as JavaScript floating-point numbers cannot the high-precision versions.

## Notes

*	If an element is __not__ a numeric value, the evaluated [error function](http://en.wikipedia.org/wiki/Error_function) is `NaN`.

	``` javascript
	var data, out;

	out = digamma( null );
	// returns NaN

	out = digamma( true );
	// returns NaN

	out = digamma( {'a':'b'} );
	// returns NaN

	out = digamma( [ true, null, [] ] );
	// returns [ NaN, NaN, NaN ]

	function getValue( d, i ) {
		return d.x;
	}
	data = [
		{'x':true},
		{'x':[]},
		{'x':{}},
		{'x':null}
	];

	out = digamma( data, {
		'accessor': getValue
	});
	// returns [ NaN, NaN, NaN, NaN ]

	out = digamma( data, {
		'path': 'x'
	});
	/*
		[
			{'x':NaN},
			{'x':NaN},
			{'x':NaN,
			{'x':NaN}
		]
	*/
	```

*	Be careful when providing a data structure which contains non-numeric elements and specifying an `integer` output data type, as `NaN` values are cast to `0`.

	``` javascript
	var out = digamma( [ true, null, [] ], {
		'dtype': 'int8'
	});
	// returns Int8Array( [0,0,0] );
	```


## Examples

``` javascript
var matrix = require( 'dstructs-matrix' ),
	digamma = require( 'compute-digamma' );

var data,
	mat,
	out,
	tmp,
	i;

// Plain arrays...
data = new Array( 10 );
for ( i = 0; i < data.length; i++ ) {
	data[ i ] = Math.random()*20 - 10;
}
out = digamma( data );

// Object arrays (accessors)...
function getValue( d ) {
	return d.x;
}
for ( i = 0; i < data.length; i++ ) {
	data[ i ] = {
		'x': data[ i ]
	};
}
out = digamma( data, {
	'accessor': getValue
});

// Deep set arrays...
for ( i = 0; i < data.length; i++ ) {
	data[ i ] = {
		'x': [ i, data[ i ].x ]
	};
}
out = digamma( data, {
	'path': 'x/1',
	'sep': '/'
});

// Typed arrays...
data = new Int32Array( 10 );
for ( i = 0; i < data.length; i++ ) {
	data[ i ] = Math.random() * 100;
}
tmp = digamma( data );
out = '';
for ( i = 0; i < data.length; i++ ) {
	out += tmp[ i ];
	if ( i < data.length-1 ) {
		out += ',';
	}
}

// Matrices...
mat = matrix( data, [5,2], 'int32' );
out = digamma( mat );


// Matrices (custom output data type)...
out = digamma( mat, {
	'dtype': 'uint8'
});
```

To run the example code from the top-level application directory,

``` bash
$ node ./examples/index.js
```


## Tests

### Unit

Unit tests use the [Mocha](http://mochajs.org) test framework with [Chai](http://chaijs.com) assertions. To run the tests, execute the following command in the top-level application directory:

``` bash
$ make test
```

All new feature development should have corresponding unit tests to validate correct functionality.


### Test Coverage

This repository uses [Istanbul](https://github.com/gotwarlost/istanbul) as its code coverage tool. To generate a test coverage report, execute the following command in the top-level application directory:

``` bash
$ make test-cov
```

Istanbul creates a `./reports/coverage` directory. To access an HTML version of the report,

``` bash
$ make view-cov
```


---
## License

[MIT license](http://opensource.org/licenses/MIT).


## Copyright

Copyright &copy; 2015. The [Compute.io](https://github.com/compute-io) Authors.


[npm-image]: http://img.shields.io/npm/v/compute-digamma.svg
[npm-url]: https://npmjs.org/package/compute-digamma

[travis-image]: http://img.shields.io/travis/compute-io/digamma/master.svg
[travis-url]: https://travis-ci.org/compute-io/digamma

[codecov-image]: https://img.shields.io/codecov/c/github/compute-io/digamma/master.svg
[codecov-url]: https://codecov.io/github/compute-io/digamma?branch=master

[dependencies-image]: http://img.shields.io/david/compute-io/digamma.svg
[dependencies-url]: https://david-dm.org/compute-io/digamma

[dev-dependencies-image]: http://img.shields.io/david/dev/compute-io/digamma.svg
[dev-dependencies-url]: https://david-dm.org/dev/compute-io/digamma

[github-issues-image]: http://img.shields.io/github/issues/compute-io/digamma.svg
[github-issues-url]: https://github.com/compute-io/digamma/issues
