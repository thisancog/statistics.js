'use strict';

let assert = require('assert');
let Statistics = require('../statistics.js'),
	stats = new Statistics([1, 2, 3], {}, { suppressWarnings: true }),
	statsTooLow = new Statistics([{ a: 1 }, { a: 2 }, { a: 3 }], { a: 'nominal' }, { suppressWarnings: true });

let threshhold = stats.epsilon;


/********************************
	Minimum and maximum
 ********************************/

describe(".minimum() and .maximum()", () => {
	it("should compute the minimum and maximum of several numbers", () => {		
		assert.equal(stats.minimum([3, 6, 12, 24]), 3);
		assert.equal(stats.maximum([12, 6, 24, 3]), 24);
		assert.equal(stats.minimum([-4, 9, 81, 76, 44, -34, 12.4, 2]), -34);
		assert.equal(stats.maximum([-4, 9, 81, 76, 44, -34, 12.4, 2]), 81);
	});

	it("should sort the values numerically, not alphabetically", () => {
		assert.equal(stats.minimum([2, 9, 10, 11, 12]), 2);
		assert.equal(stats.maximum([2, 9, 10, 11, 12]), 12);
	});

	it("should compute the minimum and maximum of one number and return it", () => {		
		assert.equal(stats.minimum([3]), 3);
		assert.equal(stats.maximum([3]), 3);
	});

	it("should return undefined if the array is empty or no value is given", () => {
		assert.equal(stats.minimum([]), undefined);
		assert.equal(stats.minimum(), undefined);
		assert.equal(stats.maximum([]), undefined);
		assert.equal(stats.maximum(), undefined);
	});

	it("should return undefined if there are any non-numeric values", () => {
		assert.equal(stats.minimum([2, 31, false, 24, "a", 12, 7]), undefined);
		assert.equal(stats.maximum([2, 31, false, 24, "a", 12, 7]), undefined);
	});

	it("should return undefined if the scale of measure is too low", () => {
		assert.equal(statsTooLow.minimum('a'), undefined);
		assert.equal(statsTooLow.maximum('a'), undefined);
	});
});


/********************************
	Range
 ********************************/

describe(".range()", () => {
	it("should compute the range of several numbers", () => {		
		assert.equal(stats.range([3, 6, 12, 24]), 21);
		assert.equal(stats.range([-4, 9, 81, 76, 44, -34, 12.4, 2]), 115);
	});

	it("should sort the values numerically, not alphabetically", () => {
		assert.equal(stats.range([2, 9, 10, 11, 12]), 10);
	});

	it("should compute the range of one number and return 0", () => {		
		assert.equal(stats.range([3]), 0);
	});

	it("should return undefined if the array is empty or no value is given", () => {
		assert.equal(stats.range([]), undefined);
		assert.equal(stats.range(), undefined);
	});

	it("should return undefined if there are any non-numeric values", () => {
		assert.equal(stats.range([2, 31, false, 24, "a", 12, 7]), undefined);
	});

	it("should return the unique values if the scale of measure is nominal", () => {
		assert.deepEqual(statsTooLow.range('a'), [1, 2, 3]);
	});
});


/************************************************************************************************
	Variance, standard deviation, coefficient of variation and index of dispersion
 ************************************************************************************************/

describe(".variance(), .standardDeviation(), .coefficientOfVariation() and .indexOfDispersion()", () => {
	it("should compute the correct value of several numbers", () => {		
		assert.equal(Math.abs(stats.variance([3, 6, 12, 24]) - 86.25) < threshhold, true);
		assert.equal(Math.abs(stats.variance([-4, 9, 81, 76, 44, -34, 12.4, 2]) - 1620.0914285714) < threshhold, true);

		assert.equal(Math.abs(stats.standardDeviation([3, 6, 12, 24]) - 9.2870878105) < threshhold, true);
		assert.equal(Math.abs(stats.standardDeviation([-4, 9, 81, 76, 44, -34, 12.4, 2]) - 40.250359359) < threshhold, true);

		assert.equal(Math.abs(stats.coefficientOfVariation([3, 6, 12, 24]) - 0.82552) < threshhold, true);
		assert.equal(Math.abs(stats.coefficientOfVariation([-4, 9, 81, 76, 44, -34, 12.4, 2]) - 1.72748) < threshhold, true);

		assert.equal(Math.abs(stats.indexOfDispersion([3, 6, 12, 24]) - 7.66666666) < threshhold, true);
		assert.equal(Math.abs(stats.indexOfDispersion([-4, 9, 81, 76, 44, -34, 12.4, 2]) - 69.5318209687) < threshhold, true);
	});

	it("should compute the correct population value of several numbers", () => {		
		assert.equal(Math.abs(stats.variance([3, 6, 12, 24], false) - 64.6875) < threshhold, true);
		assert.equal(Math.abs(stats.variance([-4, 9, 81, 76, 44, -34, 12.4, 2], false) - 1417.58) < threshhold, true);

		assert.equal(Math.abs(stats.standardDeviation([3, 6, 12, 24], false) - 8.04285397197) < threshhold, true);
		assert.equal(Math.abs(stats.standardDeviation([-4, 9, 81, 76, 44, -34, 12.4, 2], false) - 37.6507636044) < threshhold, true);
	});

	it("should compute the value for two equal numbers and return 0", () => {		
		assert.equal(stats.variance([3, 3]), 0);
		assert.equal(stats.standardDeviation([3, 3]), 0);
		assert.equal(stats.coefficientOfVariation([3, 3]), 0);
		assert.equal(stats.indexOfDispersion([3, 3]), 0);
	});

	it("should return undefined if the array has less than two elements or no value is given", () => {
		assert.equal(stats.variance([3]), undefined);
		assert.equal(stats.variance([]), undefined);
		assert.equal(stats.variance(), undefined);

		assert.equal(stats.standardDeviation([3]), undefined);
		assert.equal(stats.standardDeviation([]), undefined);
		assert.equal(stats.coefficientOfVariation(), undefined);

		assert.equal(stats.coefficientOfVariation([3]), undefined);
		assert.equal(stats.coefficientOfVariation([]), undefined);
		assert.equal(stats.coefficientOfVariation(), undefined);

		assert.equal(stats.indexOfDispersion([3]), undefined);
		assert.equal(stats.indexOfDispersion([]), undefined);
		assert.equal(stats.indexOfDispersion(), undefined);
	});

	it("should return undefined if there are any non-numeric values", () => {
		assert.equal(stats.variance([2, 31, false, 24, "a", 12, 7]), undefined);
		assert.equal(stats.standardDeviation([2, 31, false, 24, "a", 12, 7]), undefined);
		assert.equal(stats.coefficientOfVariation([2, 31, false, 24, "a", 12, 7]), undefined);
		assert.equal(stats.indexOfDispersion([2, 31, false, 24, "a", 12, 7]), undefined);
	});

	it("should return undefined if the scale of measure is nominal", () => {
		assert.equal(statsTooLow.variance('a'), undefined);
		assert.equal(statsTooLow.standardDeviation('a'), undefined);
		assert.equal(statsTooLow.coefficientOfVariation('a'), undefined);
		assert.equal(statsTooLow.indexOfDispersion('a'), undefined);
	});
});


/********************************
	Geometric standard deviation
 ********************************/

describe(".geometricStandardDeviation()", () => {
	it("should compute the geometric standard deviation of several numbers", () => {		
		assert.equal(Math.abs(stats.geometricStandardDeviation([3, 6, 12, 24]) - 2.170509878651) < threshhold, true);
		assert.equal(Math.abs(stats.geometricStandardDeviation([4, 9, 81, 76, 44, 34, 12.4, 2]) - 3.61979271376905) < threshhold, true);
	});

	it("should compute the geometric standard deviation of one number and return 1", () => {		
		assert.equal(stats.geometricStandardDeviation([3]), 1);
	});

	it("should return undefined if the array is empty or no value is given", () => {
		assert.equal(stats.geometricStandardDeviation([]), undefined);
		assert.equal(stats.geometricStandardDeviation(), undefined);
	});

	it("should return undefined if any value is not positive or non-numeric", () => {
		assert.equal(stats.geometricStandardDeviation([-4, 9, 81, 76, 44, -34, 12.4, 2]), undefined);
		assert.equal(stats.geometricStandardDeviation([4, 9, 81, 76, 44, 0, 12.4, 2]), undefined);
		assert.equal(stats.geometricStandardDeviation([2, 31, false, 24, "a", 12, 7]), undefined);
	});

	it("should return undefined if the scale of measure is nominal", () => {
		assert.equal(statsTooLow.geometricStandardDeviation('a'), undefined);
	});
});


/********************************
	Median absolute deviation
 ********************************/

describe(".medianAbsoluteDeviation()", () => {
	it("should compute the median absolute deviation of several numbers", () => {		
		assert.equal(stats.medianAbsoluteDeviation([3, 6, 12, 24]), 4.5);
		assert.equal(stats.medianAbsoluteDeviation([0, 1.3, 2.7, 3.0, 4.5, 4.6, 9.2, 9.4, 12.3, 22.1]), 3.9);
	});

	it("should sort the values numerically, not alphabetically", () => {
		assert.equal(stats.medianAbsoluteDeviation([2, 9, 10, 11, 12]), 1);
	});

	it("should compute the median absolute deviation of one number and return 0", () => {
		assert.equal(stats.medianAbsoluteDeviation([2]), 0);
		assert.equal(stats.medianAbsoluteDeviation([0]), 0);
	});

	it("should return undefined if the array is empty or no value is given", () => {
		assert.equal(stats.medianAbsoluteDeviation([]), undefined);
		assert.equal(stats.medianAbsoluteDeviation(), undefined);
	});

	it("should return undefined if there are any non-numeric values", () => {
		assert.equal(stats.medianAbsoluteDeviation([2, 31, false, 24, "a", 12, 7]), undefined);
	});

	it("should return undefined if the scale of measure is too low", () => {
		assert.equal(statsTooLow.medianAbsoluteDeviation('a'), undefined);
	});
});


/****************************************************************
	Frequencies and cumulative frequency
 ****************************************************************/

describe(".frequencies() and .cumulativeFrequency()", () => {
	it("should compute the frequencies and cumulative frequency of several numbers", () => {
		let expected = [
			{value: 6, absolute: 4, relative: 0.4},
			{value: 3, absolute: 2, relative: 0.2},
			{value: 5, absolute: 2, relative: 0.2},
			{value: 9, absolute: 2, relative: 0.2}
		];
		assert.deepEqual(stats.frequencies([3, 3, 5, 5, 6, 6, 6, 6, 9, 9]), expected);
		assert.equal(stats.cumulativeFrequency([3, 3, 5, 5, 6, 6, 6, 6, 9, 9], 6), 8);
	});

	it("should sort the values numerically, not alphabetically", () => {
		assert.equal(stats.cumulativeFrequency([2, 9, 10, 11, 12], 11), 4);
	});

	it("should compute the cumulative frequency of one number and return 1", () => {
		assert.equal(stats.cumulativeFrequency([2], 2), 1);
		assert.equal(stats.cumulativeFrequency([0], 2), 1);
	});

	it("should return undefined if the array is empty or no value is given", () => {
		assert.equal(stats.frequencies([]), undefined);
		assert.equal(stats.frequencies(), undefined);
		assert.equal(stats.cumulativeFrequency([], 1), undefined);
		assert.equal(stats.cumulativeFrequency([]), undefined);
		assert.equal(stats.cumulativeFrequency(), undefined);
	});

	it("should return undefined if there are any non-numeric values", () => {
		assert.equal(stats.cumulativeFrequency([2, 31, false, 24, "a", 12, 7]), undefined);
	});

	it("should return undefined if the scale of measure is too low", () => {
		assert.equal(statsTooLow.cumulativeFrequency('a'), undefined);
	});
});


/****************************************************************
	Quantile, quartiles and interquartile range
 ****************************************************************/

describe(".quantile(), .quartiles() and .interQuartileRange()", () => {
	it("should compute the correct values of several numbers", () => {
		assert.equal(stats.quantile([3, 3, 5, 5, 6, 6, 6, 6, 9, 9], 0.6), 6);
		assert.deepEqual(stats.quartiles([3, 3, 5, 5, 6, 6, 6, 6, 9, 9]), [5, 6]);
		assert.equal(stats.interQuartileRange([3, 3, 5, 5, 6, 6, 6, 6, 9, 9]), 1);
	});

	it("should compute the arithmetic mean if quantile falls inbetween two numbers", () => {
		assert.equal(stats.quantile([2, 9, 10, 11, 12], 0.5), 10);
		assert.deepEqual(stats.quartiles([2, 9, 10, 11, 12]), [9, 11]);
		assert.equal(stats.interQuartileRange([2, 9, 10, 11, 12]), 2);
	});

	it("should sort the values numerically, not alphabetically", () => {
		assert.equal(stats.quantile([2, 9, 10, 11, 12], 0.4), 9.5);
		assert.deepEqual(stats.quartiles([2, 9, 10, 11, 11, 4, 12, 15, 19, 22]), [9, 15]);
		assert.equal(stats.interQuartileRange([2, 9, 10, 11, 11, 4, 12, 15, 19, 22]), 6);
	});

	it("should compute the quantile, quartiles and interquartile range of one number and return that number", () => {
		assert.equal(stats.quantile([2], 0.2), 2);
		assert.deepEqual(stats.quartiles([0]), [0, 0]);
		assert.equal(stats.interQuartileRange([0]), 0);
	});

	it("should return undefined if the percentage is below 0 or above 1", () => {
		assert.equal(stats.quantile([3, 3, 5, 5, 6, 6, 6, 6, 9, 9], -0.6), undefined);
		assert.equal(stats.quantile([3, 3, 5, 5, 6, 6, 6, 6, 9, 9], 1.6), undefined);
	});

	it("should return undefined if the array is empty or no value is given", () => {
		assert.equal(stats.quantile([], 0.2), undefined);
		assert.equal(stats.quantile([]), undefined);
		assert.equal(stats.quantile(), undefined);
		assert.equal(stats.quartiles([]), undefined);
		assert.equal(stats.quartiles(), undefined);
		assert.equal(stats.interQuartileRange([]), undefined);
		assert.equal(stats.interQuartileRange(), undefined);
	});

	it("should return undefined if there are any non-numeric values", () => {
		assert.equal(stats.quantile([2, 31, false, 24, "a", 12, 7]), undefined);
		assert.equal(stats.quartiles([2, 31, false, 24, "a", 12, 7]), undefined);
		assert.equal(stats.interQuartileRange([2, 31, false, 24, "a", 12, 7]), undefined);
	});

	it("should return undefined if the scale of measure is too low", () => {
		assert.equal(statsTooLow.quantile('a'), undefined);
		assert.equal(statsTooLow.quartiles('a'), undefined);
		assert.equal(statsTooLow.interQuartileRange('a'), undefined);
	});
});
