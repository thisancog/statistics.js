'use strict';

let assert = require('assert');
let Statistics = require('../statistics.js'),
	stats = new Statistics([1, 2, 3], {}, { suppressWarnings: true }),
	statsTooLow = new Statistics([{ a: 1 }, { a: 2 }, { a: 3 }], { a: 'nominal' }, { suppressWarnings: true });

let threshhold = stats.epsilon;

/********************************
	Arithmetic mean
 ********************************/

describe(".arithmeticMean() and .mean() (an alias)", () => {
	it("should compute the mean of several numbers", () => {		
		assert.equal(stats.mean([3, 6, 12, 24]), 11.25);
		assert.equal(stats.arithmeticMean([12, 6, 24, 3]), 11.25);
		assert.equal(stats.mean([-4, 9, 81, 76, 44, -34, 12.4, 2]), 23.3);
		assert.equal(stats.arithmeticMean([-4, 9, 81, 76, 44, -34, 12.4, 2]), 23.3);
	});

	it("should compute the mean of one number and return it", () => {		
		assert.equal(stats.mean([3]), 3);
		assert.equal(stats.arithmeticMean([3]), 3);
	});

	it("should return undefined if the array is empty or no value is given", () => {
		assert.equal(stats.mean([]), undefined);
		assert.equal(stats.mean(), undefined);
		assert.equal(stats.arithmeticMean([]), undefined);
		assert.equal(stats.arithmeticMean(), undefined);
	});

	it("should return undefined if there are any non-numeric values", () => {
		assert.equal(stats.mean([2, 31, false, 24, "a", 12, 7]), undefined);
		assert.equal(stats.arithmeticMean([2, 31, false, 24, "a", 12, 7]), undefined);
	});

	it("should return undefined if the scale of measure is too low", () => {
		assert.equal(statsTooLow.mean('a'), undefined);
		assert.equal(statsTooLow.arithmeticMean('a'), undefined);
	});
});


/********************************
	Geometric mean
 ********************************/

describe(".geometricMean()", () => {
	it("should compute the mean of several numbers", () => {		
		assert.equal(Math.abs(stats.geometricMean([3, 6, 12, 24]) - 8.485281374) < threshhold, true);
		assert.equal(Math.abs(stats.geometricMean([4, 9, 81, 76, 44, 34, 12.4, 2]) - 17.3529393258) < threshhold, true);
	});

	it("should compute the mean of one number and return it", () => {		
		assert.equal(stats.geometricMean([3]), 3);
	});

	it("should return undefined if any value is not positive or non-numeric", () => {
		assert.equal(stats.geometricMean([-4, 9, 81, 76, 44, -34, 12.4, 2]), undefined);
		assert.equal(stats.geometricMean([4, 9, 81, 76, 44, 0, 12.4, 2]), undefined);
		assert.equal(stats.geometricMean([2, 31, false, 24, "a", 12, 7]), undefined);
	});

	it("should return undefined if the array is empty or no value is given", () => {
		assert.equal(stats.geometricMean([]), undefined);
	});

	it("should return undefined if the scale of measure is too low", () => {
		assert.equal(statsTooLow.geometricMean('a'), undefined);
	});
});


/********************************
	Harmonic mean
 ********************************/

describe(".harmonicMean()", () => {
	it("should compute the mean of several numbers", () => {		
		assert.equal(stats.harmonicMean([3, 6, 12, 24]), 6.4);
		assert.equal(Math.abs(stats.harmonicMean([4, 9, 81, 76, 44, 34, 12.4, 2]) - 7.84776217517) < threshhold, true);
	});

	it("should compute the mean of one number and return it", () => {		
		assert.equal(stats.harmonicMean([3]), 3);
	});

	it("should return undefined if any value is zero", () => {
		assert.equal(stats.harmonicMean([4, 9, 81, 76, 44, 0, 12.4, 2]), 0);
	});

	it("should return undefined if any value is smaller than 0 or non-numeric", () => {
		assert.equal(stats.harmonicMean([-4, 9, 81, 76, 44, -34, 12.4, 2]), undefined);
		assert.equal(stats.harmonicMean([2, 31, false, 24, "a", 12, 7]), undefined);
	});

	it("should return undefined if the array is empty or no value is given", () => {
		assert.equal(stats.harmonicMean([]), undefined);
	});

	it("should return undefined if the scale of measure is too low", () => {
		assert.equal(statsTooLow.harmonicMean('a'), undefined);
	});
});


/********************************
	Root mean square
 ********************************/

describe(".rootMeanSquare()", () => {
	it("should compute the correct root mean square of several numbers", () => {
		assert.equal(Math.abs(stats.rootMeanSquare([4, 9, 12, 3, 7]) - 7.7330459) < threshhold, true);
		assert.equal(Math.abs(stats.rootMeanSquare([1.3, 4.6, 22.1, 3.0, 0]) - 10.20058821) < threshhold, true);
	});

	it("should compute the root mean square of one number and return its absolute value", () => {
		assert.equal(stats.rootMeanSquare([2]), 2);
		assert.equal(stats.rootMeanSquare([-2]), 2);
		assert.equal(stats.rootMeanSquare([0]), 0);
	});

	it("should return undefined if the array is empty or no value is given", () => {
		assert.equal(stats.rootMeanSquare([]), undefined);
		assert.equal(stats.rootMeanSquare(), undefined);
	});

	it("should return undefined if there are any non-numeric values", () => {
		assert.equal(stats.rootMeanSquare([2, 31, false, 24, "a", 12, 7]), undefined);
	});

	it("should return undefined if the scale of measure is too low", () => {
		assert.equal(statsTooLow.rootMeanSquare('a'), undefined);
	});
});


/********************************
	Cubic mean
 ********************************/

describe(".cubicMean()", () => {
	it("should compute the correct cubic mean of several numbers", () => {
		assert.equal(Math.abs(stats.cubicMean([4, 9, 12, 3, 7]) - 8.330914853) < threshhold, true);
		assert.equal(Math.abs(stats.cubicMean([1.3, 4.6, 22.1, 3.0, 0]) - 12.97446427177) < threshhold, true);
	});

	it("should compute the cubic mean of one number and return its value", () => {
		assert.equal(stats.cubicMean([2]), 2);
		assert.equal(stats.cubicMean([0]), 0);
	});

	it("should return zero if the sum of the cubes is zero", () => {
		assert.equal(stats.cubicMean([2, -4, -2, 4]), 0);
	});

	it("should return undefined if the sum of the cubes is negative", () => {
		assert.equal(stats.cubicMean([1.3, 4.6, -22.1, -3.0, 0]), undefined);
	});

	it("should return undefined if the array is empty or no value is given", () => {
		assert.equal(stats.cubicMean([]), undefined);
		assert.equal(stats.cubicMean(), undefined);
	});

	it("should return undefined if there are any non-numeric values", () => {
		assert.equal(stats.cubicMean([2, 31, false, 24, "a", 12, 7]), undefined);
	});

	it("should return undefined if the scale of measure is too low", () => {
		assert.equal(statsTooLow.rootMeanSquare('a'), undefined);
	});
});


/********************************
	Winsorised Mean
 ********************************/

describe(".winsorisedMean()", () => {
	it("should compute the correct Winsorised Mean of several numbers", () => {
		assert.equal(Math.abs(stats.winsorisedMean([2, 3, 4, 4, 7, 8, 9, 9, 12, 13], 0.2) - 6.7) < threshhold, true);
		assert.equal(Math.abs(stats.winsorisedMean([0, 1.3, 2.7, 3.0, 4.5, 4.6, 9.2, 9.4, 12.3, 22.1], 0.4) - 4.55) < threshhold, true);
	});

	it("should compute the Winsorised Mean of one number and return its value", () => {
		assert.equal(stats.winsorisedMean([2]), 2);
		assert.equal(stats.winsorisedMean([0]), 0);
	});

	it("should return the arithmetic mean if the percentage is equal to 0", () => {
		assert.equal(stats.winsorisedMean([4, 9, 12, 3, 7], 0), 7);
	});

	it("should return the median if the percentage is equal to 0.5", () => {
		assert.equal(stats.winsorisedMean([4, 9, 12, 3, 7], 0.5), 7);
		assert.equal(stats.winsorisedMean([4, 9, 12, 3], 0.5), 6.5);
	});

	it("should return undefined if the percentage is below 0 or larger than 0.5", () => {
		assert.equal(stats.winsorisedMean([4, 9, 12, 3, 7], -0.1), undefined);
		assert.equal(stats.winsorisedMean([4, 9, 12, 3, 7], 0.6), undefined);
	});

	it("should return undefined if the array is empty or no value is given", () => {
		assert.equal(stats.winsorisedMean([]), undefined);
		assert.equal(stats.winsorisedMean(), undefined);
	});

	it("should return undefined if there are any non-numeric values", () => {
		assert.equal(stats.winsorisedMean([2, 31, false, 24, "a", 12, 7]), undefined);
	});

	it("should return undefined if the scale of measure is too low", () => {
		assert.equal(statsTooLow.winsorisedMean('a'), undefined);
	});
});



/********************************
	Gaswirth-Cohen Mean
 ********************************/

describe(".gastwirthCohenMean()", () => {
	it("should compute the correct Gaswirth-Cohen Mean of several numbers", () => {
		assert.equal(Math.abs(stats.gastwirthCohenMean([2, 3, 4, 4, 7, 8, 9, 9, 12, 13], { alpha: 0.2, lambda: 0.1 }) - 7.4) < threshhold, true);
		assert.equal(Math.abs(stats.gastwirthCohenMean([0, 1.3, 2.7, 3.0, 4.5, 4.6, 9.2, 9.4, 12.3, 22.1], { alpha: 0.4, lambda: 0.3 }) - 5.015) < threshhold, true);
	});

	it("should compute the Gaswirth-Cohen Mean of one number and return its value", () => {
		assert.equal(stats.gastwirthCohenMean([2], { alpha: 0.1, lambda: 0.1 }), 2);
		assert.equal(stats.gastwirthCohenMean([0], { alpha: 0.2, lambda: 0.2 }), 0);
	});

	it("should return undefined if alpha or lambda are below 0 or larger than 0.5", () => {
		assert.equal(stats.gastwirthCohenMean([4, 9, 12, 3, 7], { alpha: -0.1, lambda: 0.1 }), undefined);
		assert.equal(stats.gastwirthCohenMean([4, 9, 12, 3, 7], { alpha: 0.6, lambda: 0.1 }), undefined);
		assert.equal(stats.gastwirthCohenMean([4, 9, 12, 3, 7], { alpha: 0.1, lambda: -0.1 }), undefined);
		assert.equal(stats.gastwirthCohenMean([4, 9, 12, 3, 7], { alpha: 0.1, lambda: 0.6 }), undefined);
	});

	it("should return undefined if the array is empty or no value is given", () => {
		assert.equal(stats.gastwirthCohenMean([], { alpha: 0.2, lambda: 0.1 }), undefined);
		assert.equal(stats.gastwirthCohenMean(), undefined);
	});

	it("should return undefined if there are any non-numeric values", () => {
		assert.equal(stats.gastwirthCohenMean([2, 31, false, 24, "a", 12, 7], { alpha: 0.2, lambda: 0.1 }), undefined);
	});

	it("should return undefined if the scale of measure is too low", () => {
		assert.equal(statsTooLow.gastwirthCohenMean('a', { alpha: 0.2, lambda: 0.1 }), undefined);
	});
});


/********************************
	Mid-range
 ********************************/

describe(".midRange()", () => {
	it("should compute the correct mid-range of several numbers", () => {
		assert.equal(Math.abs(stats.midRange([2, 3, 4, 4, 7, 8, 9, 9, 12, 13]) - 7.5) < threshhold, true);
		assert.equal(Math.abs(stats.midRange([0, 1.3, 2.7, 3.0, 4.5, 4.6, 9.2, 9.4, 12.3, 22.1]) - 11.05) < threshhold, true);
	});

	it("should compute the mid-range of one number and return its value", () => {
		assert.equal(stats.midRange([2]), 2);
		assert.equal(stats.midRange([0]), 0);
	});

	it("should return undefined if the array is empty or no value is given", () => {
		assert.equal(stats.midRange([]), undefined);
		assert.equal(stats.midRange(), undefined);
	});

	it("should return undefined if there are any non-numeric values", () => {
		assert.equal(stats.midRange([2, 31, false, 24, "a", 12, 7]), undefined);
	});

	it("should return undefined if the scale of measure is too low", () => {
		assert.equal(statsTooLow.midRange('a'), undefined);
	});
});


/********************************
	Median
 ********************************/

describe(".median()", () => {
	it("should compute the correct median of several numbers", () => {
		assert.equal(Math.abs(stats.median([2, 3, 4, 4, 7, 8, 9, 9, 12, 13]) - 7.5) < threshhold, true);
		assert.equal(Math.abs(stats.median([0, 1.3, 2.7, 3.0, 4.5, 4.6, 9.2, 9.4, 12.3, 22.1]) - 4.55) < threshhold, true);
	});

	it("should compute the median of an even amount of numbers and return the arithmetic mean of both middle numbers", () => {
		assert.equal(stats.median([2, 5, 7, 9]), 6);
		assert.equal(stats.median([0, 0, 1, 1]), 0.5);
	});

	it("should sort the values numerically, not alphabetically", () => {
		assert.equal(stats.median([2, 9, 10, 11, 12]), 10);
	});

	it("should compute the median of one number and return its value", () => {
		assert.equal(stats.median([2]), 2);
		assert.equal(stats.median([0]), 0);
	});

	it("should return undefined if the array is empty or no value is given", () => {
		assert.equal(stats.median([]), undefined);
		assert.equal(stats.median(), undefined);
	});

	it("should return undefined if there are any non-numeric values", () => {
		assert.equal(stats.median([2, 31, false, 24, "a", 12, 7]), undefined);
	});

	it("should return undefined if the scale of measure is too low", () => {
		assert.equal(statsTooLow.median('a'), undefined);
	});
});


/********************************
	Mode
 ********************************/

describe(".mode()", () => {
	it("should compute the correct mode of several numbers", () => {
		assert.equal(stats.mode([2, 3, 4, 7, 8, 9, 9, 12, 13]), 9);
		assert.equal(stats.mode([0, 1.3, 2.7, 3.0, 4.6, 4.6, 9.2, 9.4, 12.3, 22.1]), 4.6);
	});

	it("should return multimodal results if there are more than one most common values", () => {
		assert.deepEqual(stats.mode([2, 3, 4, 4, 7, 8, 9, 9, 12, 13]), [4, 9]);
		assert.deepEqual(stats.mode([0, 1.3, 2.7, 2.7, 4.5, 4.6, 9.4, 9.4, 12.3, 22.1]), [2.7, 9.4]);
	});

	it("should compute the mode of one number and return its value", () => {
		assert.equal(stats.mode([2]), 2);
		assert.equal(stats.mode([0]), 0);
	});

	it("should return undefined if the array is empty or no value is given", () => {
		assert.equal(stats.mode([]), undefined);
		assert.equal(stats.mode(), undefined);
	});

	it("should return undefined if there are any non-numeric values", () => {
		assert.equal(stats.mode([2, 31, 4, 24, false, 12, 7, "a", false, 9]), false);
	});
});
