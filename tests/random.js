'use strict';

let assert = require('assert');
let Statistics = require('../statistics.js'),
	testVar = [
		{ a: 1, b: 1, c: 6, d: 1, e: 4, f: 3 },
		{ a: 2, b: 2, c: 5, d: 1, e: 3, f: 7 },
		{ a: 3, b: 3, c: 4, d: 1, f: 9 },
		{ a: 4, b: 4, c: 3, d: 1, e: 7, f: 2 },
		{ a: 5, b: 5, c: 2, d: 1, f: 4, },
		{ a: 6, b: 6, c: 1, d: 1, e: 9, f: 11 }
	],
	testColumns = {
		a: 'metric',
		b: 'nominal',
		c: 'metric',
		d: 'metric',
		e: 'metric',
		f: 'metric'
	},
	stats = new Statistics(testVar, testColumns, { suppressWarnings: true }),
	statsTooLow = new Statistics([{ a: 1 }, { a: 2 }, { a: 3 }], { a: 'nominal' }, { suppressWarnings: true });

let threshhold = stats.epsilon;


/****************************************************************
	Fisher-Yates shuffle
 ****************************************************************/

describe(".fisherYatesShuffle()", () => {
	let arr = [1, 2, 3, 4];
	let iterations = 5000,
		frequencies = {},
		min = iterations + 1,
		max = 0,
		maxDeviation = 0.001,
		xorshift = new stats.xorshift([100934093, 482920221, 592807725, 993051833], 1000);

	for (var i = 0; i < iterations; i++) {
		arr = stats.fisherYatesShuffle(arr, xorshift.next);
		let index = arr.join("");
		frequencies[index] = (stats.has(frequencies, index)) ? frequencies[index] + 1 : 1;
	}

	for (var item in frequencies) {
		if (frequencies[item] < min) min = frequencies[item];
		if (frequencies[item] > min) max = frequencies[item];
	}

	it("should shuffle randomly (enough)", () => {
		assert.equal((max - min) / iterations <= maxDeviation, true);
	});

	it("should return undefined if no data is given", () => {
		assert.equal(stats.fisherYatesShuffle(), undefined);
	});
});