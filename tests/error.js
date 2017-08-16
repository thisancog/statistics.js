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
	Gaussian Error and inverse Gaussian error
 ****************************************************************/

describe(".gaussianError() and .inverseGaussianError()", () => {
	it("should compute the correct values", () => {
		assert.equal(Math.abs(stats.gaussianError(0.3) - 0.32862675945912) < threshhold, true);
		assert.equal(Math.abs(stats.inverseGaussianError(0.3) - 0.2724627147267) < threshhold, true);
	});

	it("should return undefined if x is not numeric", () => {		
		assert.equal(stats.gaussianError("a"), undefined);
		assert.equal(stats.inverseGaussianError("a"), undefined);
		assert.equal(stats.gaussianError(NaN), undefined);
		assert.equal(stats.inverseGaussianError(NaN), undefined);
	});

	it("should return undefined if x is smaller than -1 or larger than 1", () => {		
		assert.equal(stats.inverseGaussianError(-1.3), undefined);
		assert.equal(stats.inverseGaussianError(2.4), undefined);
	});

	it("should return undefined if no value is given", () => {
		assert.equal(stats.gaussianError(), undefined);
		assert.equal(stats.inverseGaussianError(), undefined);
	});
});


/********************************
	Probit
 ********************************/

describe(".probit()", () => {
	it("should compute the correct values", () => {
		assert.equal(Math.abs(stats.probit(0.2) + 0.84162123357291) < threshhold, true);
		assert.equal(stats.probit(0.5) < threshhold, true);
		assert.equal(Math.abs(stats.probit(0.9) - 1.2815515655) < threshhold, true);
	});

	it("should return undefined if quantile is smaller than 0 or larger than 1", () => {		
		assert.equal(stats.probit(-0.3), undefined);
		assert.equal(stats.probit(2.4), undefined);
	});

	it("should return Infinity/-Infinity if quantile is 1/0 respectively", () => {		
		assert.equal(stats.probit(0), -Infinity);
		assert.equal(stats.probit(1), Infinity);
	});

	it("should return undefined if quantile is not numeric", () => {		
		assert.equal(stats.probit("a"), undefined);
	});

	it("should return undefined if no value is given", () => {
		assert.equal(stats.probit(), undefined);
	});
});

