'use strict';

let assert = require('assert');
let Statistics = require('../statistics.js'),
	stats = new Statistics([1, 2, 3], {}, { suppressWarnings: true });

let threshhold = stats.epsilon;


/********************************
	Sum
 ********************************/

describe(".sum() and .sumExact()", () => {
	it("should add several integers regardless of order", () => {		
		assert.equal(stats.sum([3, 6, 12, 24]), 45);
		assert.equal(stats.sum([12, 6, 24, 3]), 45);
		assert.equal(stats.sumExact([3, 6, 12, 24]), 45);
		assert.equal(stats.sumExact([12, 6, 24, 3]), 45);
	});

	it("should return correct floating point value for exact sum", () => {
		assert.equal(stats.sumExact([1.2, 1.00003, 2.04, -0.3, 12, 0.9]), 16.84003);
	});

	it("should return the item of the array if it's the only one", () => {
		assert.equal(stats.sum([2]), 2);
		assert.equal(stats.sumExact([2]), 2);
	});

	it("should ignore non-numeric values", () => {
		assert.equal(stats.sum([1, 2, 3, "string", false, NaN, Infinity, 4, 5]), 15);
		assert.equal(stats.sumExact([1, 2, 3, "string", false, NaN, Infinity, 4, 5]), 15);
	});

	it("should return undefined if no or empty input is given", () => {
		assert.equal(stats.sum([]), undefined);
		assert.equal(stats.sum(), undefined);
		assert.equal(stats.sumExact([]), undefined);
		assert.equal(stats.sumExact(), undefined);
	});
});


/********************************
	Product
 ********************************/

describe(".product()", () => {
	it("should multiply several integers regardless of order", () => {
		assert.equal(stats.product([3, 6, 12, 24]), 5184);
		assert.equal(stats.product([12, 6, 24, 3]), 5184);
	});

	it("should return the item of the array if it's the only one", () => {
		assert.equal(stats.product([2]), 2);
	});

	it("should handle sign correctly", () => {
		assert.equal(stats.product([2, -3, 4, 7]), -168);
		assert.equal(stats.product([2, -3, -4, 7]), 168);
	});

	it("should ignore non-numeric items", () => {
		assert.equal(stats.product([1, 3, 7, 4, 12, true, 4, "a", 3, 6, 7, 1, 2, NaN]), 1016064);
	});

	it("should return 1 if empty input is given", () => {
		assert.equal(stats.product([]), 1);
	});

	it("should return undefined if no input is given", () => {
		assert.equal(stats.product(), undefined);
	});
});


/********************************
	Factorial and gamma
 ********************************/

describe(".factorial(), .computeFactorial(), .gamma(), .gammaSpouge() and .gammaStirling()", () => {
	it("should handle non-trivial n", () => {
		assert.equal(stats.factorial(10), 3628800);
		assert.equal(stats.computeFactorial(10), 3628800);
		assert.equal(stats.gamma(10), 362880);
		assert.equal(stats.gammaSpouge(10), 362880);
		assert.equal(stats.gammaStirling(10), 362880);
	});

	it("should handle large n", () => {
		assert.equal((Math.abs(stats.factorial(25) - 15511210043330985984000000) < 1000000000), true);
		assert.equal((Math.abs(stats.computeFactorial(25) - 15511210043330985984000000) < 1000000000), true);
		assert.equal((Math.abs(stats.gamma(25) - 620448401733239439360000) < 1000000000), true);
		assert.equal((Math.abs(stats.gammaSpouge(25) - 620448401733239439360000) < 1000000000), true);
		assert.equal((Math.abs(stats.gammaStirling(25) - 620448401733239439360000) < 1000000000), true);
	});

	it("should return 1 for n = 0 and n = 1", () => {
		assert.equal(stats.factorial(0), 1);
		assert.equal(stats.factorial(1), 1);
		assert.equal(stats.computeFactorial(0), 1);
		assert.equal(stats.computeFactorial(1), 1);
		assert.equal(stats.gamma(0), Infinity);
		assert.equal(stats.gamma(1), 1);
		assert.equal(stats.gammaSpouge(0), Infinity);
		assert.equal(stats.gammaSpouge(1), 1);
		assert.equal(stats.gammaStirling(0), Infinity);
		assert.equal(stats.gammaStirling(1), 1);
	});

	it("should return undefined for n < 0", () => {
		assert.equal(stats.factorial(-2), undefined);
		assert.equal(stats.computeFactorial(-2), undefined);
		assert.equal(stats.gamma(-2), undefined);
		assert.equal(stats.gammaSpouge(-2), undefined);
		assert.equal(stats.gammaStirling(-2), undefined);
	});

	it("should return the result of the gamma function for floating point numbers", () => {
		assert.equal(Math.abs(stats.factorial(3.4) - 2.98121) <= threshhold, true);
		assert.equal(Math.abs(stats.computeFactorial(3.4) - 2.98121) <= threshhold, true);
		assert.equal(Math.abs(stats.gamma(3.4) - 2.98121) <= threshhold, true);
		assert.equal(Math.abs(stats.gammaSpouge(3.4) - 2.98121) <= threshhold, true);
		assert.equal(Math.abs(stats.gammaStirling(3.4) - 2.98121) <= threshhold, true);
	});

	it("should return different results for Spouge's and Stirling's approximation", () => {
		assert.equal(stats.gamma(3.4, true) !== stats.gamma(3.4, false), true);
		assert.equal(stats.gammaSpouge(3.4) !== stats.gammaStirling(3.4), true);
	});

	it("should return undefined if n is not numeric or not given", () => {
		assert.equal(stats.factorial(), undefined);
		assert.equal(stats.factorial("a"), undefined);
		assert.equal(stats.factorial(true), undefined);
		assert.equal(stats.factorial({}), undefined);
		assert.equal(stats.computeFactorial(), undefined);
		assert.equal(stats.computeFactorial("a"), undefined);
		assert.equal(stats.computeFactorial(true), undefined);
		assert.equal(stats.computeFactorial({}), undefined);
		assert.equal(stats.gamma(), undefined);
		assert.equal(stats.gamma("a"), undefined);
		assert.equal(stats.gamma(true), undefined);
		assert.equal(stats.gamma({}), undefined);
		assert.equal(stats.gammaSpouge(), undefined);
		assert.equal(stats.gammaSpouge("a"), undefined);
		assert.equal(stats.gammaSpouge(true), undefined);
		assert.equal(stats.gammaSpouge({}), undefined);
		assert.equal(stats.gammaStirling(), undefined);
		assert.equal(stats.gammaStirling("a"), undefined);
		assert.equal(stats.gammaStirling(true), undefined);
		assert.equal(stats.gammaStirling({}), undefined);
	});
});


describe(".incompleteGamma() and .regularisedGamma()", () => {
	it("should return the correct result", () => {
		assert.equal(Math.abs(stats.incompleteGamma(4.14, 3)  - 2.3324502722) < threshhold, true);
		assert.equal(Math.abs(stats.incompleteGamma(7, 2.3)   - 6.7405924015) < threshhold, true);
		assert.equal(Math.abs(stats.incompleteGamma(3.4, 2.1) - 0.7838603495) < threshhold, true);

		assert.equal(Math.abs(stats.regularisedGamma(3.04, 2)   - 0.3141290716) < threshhold, true);
		assert.equal(Math.abs(stats.regularisedGamma(2.7, 1.03) - 0.1253792297) < threshhold, true);
		assert.equal(Math.abs(stats.regularisedGamma(5.7, 0.8)  - 0.0003451821) < threshhold, true);
	});

	it("should return undefined if x is negative", () => {
		assert.equal(stats.incompleteGamma(2.64, -1), undefined);
		assert.equal(stats.regularisedGamma(2.64, -0.3), undefined);
	});

	it("should return undefined if x or s are not numeric or not given", () => {
		assert.equal(stats.incompleteGamma(2.64), undefined);
		assert.equal(stats.incompleteGamma(7, "a"), undefined);
		assert.equal(stats.incompleteGamma("a", 7), undefined);
		assert.equal(stats.regularisedGamma(2.64), undefined);
		assert.equal(stats.regularisedGamma(7, "a"), undefined);
		assert.equal(stats.regularisedGamma("a", 7), undefined);
	});
});


/********************************
	Binomial coefficient
 ********************************/

describe(".binomialCoefficient()", () => {
	it("should return the correct result", () => {
		assert.equal(stats.binomialCoefficient(6, 2), 15);
		assert.equal(stats.binomialCoefficient(12, 7), 792);
		assert.equal(stats.binomialCoefficient(12, 1), 12);
		assert.equal(stats.binomialCoefficient(6, 6), 1);
		assert.equal(stats.binomialCoefficient(12, 0), 1);
		assert.equal(stats.binomialCoefficient(0, 0), 1);
	});

	it("should return undefined if n is smaller than k", () => {
		assert.equal(stats.binomialCoefficient(2, 6), undefined);
	});

	it("should return undefined if n or k are smaller than 0", () => {
		assert.equal(stats.binomialCoefficient(-1, 6), undefined);
		assert.equal(stats.binomialCoefficient(6, -1), undefined);
	});

	it("should return undefined if n or k are not integers", () => {
		assert.equal(stats.binomialCoefficient(2.3, 6), undefined);
		assert.equal(stats.binomialCoefficient(6, 2.3), undefined);
		assert.equal(stats.binomialCoefficient(2, "a"), undefined);
		assert.equal(stats.binomialCoefficient("a", 2), undefined);
		assert.equal(stats.binomialCoefficient(2, true), undefined);
		assert.equal(stats.binomialCoefficient(true, 2), undefined);
	});
});


/********************************
	Beta
 ********************************/

describe(".beta(), .incompleteBeta() and .regularisedBeta()", () => {
	it("should return the correct result", () => {
		assert.equal(Math.abs(stats.beta(4, 3) - 0.0166666666) < threshhold, true);
		assert.equal(Math.abs(stats.beta(4, 9) - 0.0005050505050505) < threshhold, true);
		assert.equal(Math.abs(stats.beta(11.2, 2.4) - 0.00326837) < threshhold, true);

		assert.equal(Math.abs(stats.incompleteBeta(0.97, 4, 0.5) - 0.57808213228) < threshhold, true);
		assert.equal(Math.abs(stats.incompleteBeta(0.2, 4, 9) - 0.00010375305567) < threshhold, true);
		assert.equal(Math.abs(stats.incompleteBeta(0.5, 11.2, 2.4) - 0.0000160799) < threshhold, true);

		assert.equal(Math.abs(stats.regularisedBeta(0.4, 4, 3) - 0.1792) < threshhold, true);
		assert.equal(Math.abs(stats.regularisedBeta(0.2, 4, 9) - 0.20543105024) < threshhold, true);
		assert.equal(Math.abs(stats.regularisedBeta(0.5, 11.2, 2.4) - 0.00491987) < threshhold, true);
	});

	it("should return undefined if a or b are not positive", () => {
		assert.equal(stats.beta(0, 3), undefined);
		assert.equal(stats.beta(-1, 3), undefined);
		assert.equal(stats.beta(7, 0), undefined);
		assert.equal(stats.beta(7, -1), undefined);

		assert.equal(stats.incompleteBeta(0.3, 0, 3), undefined);
		assert.equal(stats.incompleteBeta(0.2, -1, 3), undefined);
		assert.equal(stats.incompleteBeta(0.4, 7, 0), undefined);
		assert.equal(stats.incompleteBeta(0.9, 7, -1), undefined);

		assert.equal(stats.regularisedBeta(0.2, 0, 3), undefined);
		assert.equal(stats.regularisedBeta(0.5, -1, 3), undefined);
		assert.equal(stats.regularisedBeta(0.7, 7, 0), undefined);
		assert.equal(stats.regularisedBeta(0.8, 7, -1), undefined);
	});

	it("should return undefined if x is smaller than 0 or larger than 0", () => {
		assert.equal(stats.incompleteBeta(1.1, 4, 3), undefined);
		assert.equal(stats.incompleteBeta(-0.3, 2, 3), undefined);
		assert.equal(stats.regularisedBeta(1.1, 4, 3), undefined);
		assert.equal(stats.regularisedBeta(-0.3, 2, 3), undefined);
	});

	it("should return undefined if x, a or b are not numbers", () => {
		assert.equal(stats.beta("a", 3), undefined);
		assert.equal(stats.beta(true, 3), undefined);
		assert.equal(stats.beta(3, "a"), undefined);
		assert.equal(stats.beta(3, true), undefined);

		assert.equal(stats.incompleteBeta(0.3, "a", 3), undefined);
		assert.equal(stats.incompleteBeta(0.3, true, 3), undefined);
		assert.equal(stats.incompleteBeta(0.3, 3, "a"), undefined);
		assert.equal(stats.incompleteBeta(0.3, 3, true), undefined);
		assert.equal(stats.incompleteBeta(0.3, "a", 3), undefined);
		assert.equal(stats.incompleteBeta(0.3, true, 3), undefined);
		assert.equal(stats.incompleteBeta("a", 3, 0.3), undefined);
		assert.equal(stats.incompleteBeta(true, 3, 0.3), undefined);

		assert.equal(stats.regularisedBeta(0.3, "a", 3), undefined);
		assert.equal(stats.regularisedBeta(0.3, true, 3), undefined);
		assert.equal(stats.regularisedBeta(0.3, 3, "a"), undefined);
		assert.equal(stats.regularisedBeta(0.3, 3, true), undefined);
		assert.equal(stats.regularisedBeta(0.3, "a", 3), undefined);
		assert.equal(stats.regularisedBeta(0.3, true, 3), undefined);
		assert.equal(stats.regularisedBeta("a", 3, 0.3), undefined);
		assert.equal(stats.regularisedBeta(true, 3, 0.3), undefined);
	});

	it("should return undefined if any variable is missing", () => {
		assert.equal(stats.beta(3), undefined);
		assert.equal(stats.incompleteBeta(0.3, 3), undefined);
		assert.equal(stats.regularisedBeta(0.3, 3), undefined);
	});
});

