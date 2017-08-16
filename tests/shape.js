'use strict';

let assert = require('assert');
let Statistics = require('../statistics.js'),
	stats = new Statistics([1, 2, 3], {}, { suppressWarnings: true }),
	statsTooLow = new Statistics([{ a: 1 }, { a: 2 }, { a: 3 }], { a: 'nominal' }, { suppressWarnings: true });

let threshhold = stats.epsilon;


/********************************
	Skewness
 ********************************/

describe(".skewness()", () => {
	it("should compute the correct skewness of several numbers", () => {		
		assert.equal(Math.abs(stats.skewness([3, 6, 12, 24]) - 0.65680773449) < threshhold, true);
		assert.equal(Math.abs(stats.skewness([-4, 9, 81, 76, 44, -34, 12.4, 2]) - 0.292684) < threshhold, true);
	});

	it("should compute the skewness of one number and return undefined", () => {		
		assert.equal(stats.skewness([3]), undefined);
	});

	it("should return undefined if the array is empty or no value is given", () => {
		assert.equal(stats.skewness([]), undefined);
		assert.equal(stats.skewness([]), undefined);
	});

	it("should return undefined if there are any non-numeric values", () => {
		assert.equal(stats.skewness([2, 31, false, 24, "a", 12, 7]), undefined);
	});

	it("should return undefined if the scale of measure is too low", () => {
		assert.equal(statsTooLow.skewness('a'), undefined);
	});
});



/********************************
	Kurtosis and excess kurtosis
 ********************************/

describe(".kurtosis() and .excessKurtosis()", () => {
	it("should compute the correct kurtosis of several numbers", () => {		
		assert.equal(Math.abs(stats.kurtosis([3, 6, 12, 24]) - 1.0693241965973537) < threshhold, true);
		assert.equal(Math.abs(stats.excessKurtosis([12, 6, 24, 3]) + 1.9306758) < threshhold, true);
		assert.equal(Math.abs(stats.kurtosis([-4, 9, 81, 76, 44, -34, 12.4, 2]) - 1.45627958287) < threshhold, true);
		assert.equal(Math.abs(stats.excessKurtosis([-4, 9, 81, 76, 44, -34, 12.4, 2]) + 1.54372042) < threshhold, true);
	});

	it("should compute the kurtosis of one number and return undefined", () => {		
		assert.equal(stats.kurtosis([3]), undefined);
		assert.equal(stats.excessKurtosis([3]), undefined);
	});

	it("should return undefined if the array is empty or no value is given", () => {
		assert.equal(stats.kurtosis([]), undefined);
		assert.equal(stats.kurtosis(), undefined);
		assert.equal(stats.excessKurtosis([]), undefined);
		assert.equal(stats.excessKurtosis(), undefined);
	});

	it("should return undefined if there are any non-numeric values", () => {
		assert.equal(stats.kurtosis([2, 31, false, 24, "a", 12, 7]), undefined);
		assert.equal(stats.excessKurtosis([2, 31, false, 24, "a", 12, 7]), undefined);
	});

	it("should return undefined if the scale of measure is too low", () => {
		assert.equal(statsTooLow.kurtosis('a'), undefined);
		assert.equal(statsTooLow.excessKurtosis('a'), undefined);
	});
});
