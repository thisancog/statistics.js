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
	testColumns = { a: 'metric', b: 'nominal', c: 'metric', d: 'metric', e: 'metric', f: 'metric' },
	stats = new Statistics(testVar, testColumns, { suppressWarnings: true }),
	statsTooLow = new Statistics([{ a: 1 }, { a: 2 }, { a: 3 }], { a: 'nominal' }, { suppressWarnings: true });

let threshhold = stats.epsilon;



/****************************************************************
	Normal distribution
 ****************************************************************/

describe(".normalDistribution() and .normalProbabilityDensity()", () => {
	it("should compute the correct values", () => {
		let distrib = stats.normalDistribution(),
			distrib2 = stats.normalDistribution(2, 2),
			distrib3 = stats.normalDistribution(4, 0.5);

		assert.equal(typeof distrib, 'object');
		assert.equal(Math.abs(distrib['0.00'] - 0.3989422804) < threshhold, true);
		assert.equal(Math.abs(distrib['2.57'] - 0.0146782491) < threshhold, true);

		assert.equal(typeof distrib2, 'object');
		assert.equal(Math.abs(distrib2['1.04'] - 0.2240441557) < threshhold, true);
		assert.equal(Math.abs(distrib2['3.01'] - 0.2185944433) < threshhold, true);

		assert.equal(typeof distrib3, 'object');
		assert.equal(Math.abs(distrib3['2.24'] - 0.0254773630) < threshhold, true);
		assert.equal(Math.abs(distrib3['4.62'] - 0.3841335721) < threshhold, true);

		assert.equal(Math.abs(stats.normalProbabilityDensity(0.41) - 0.3667816624) < threshhold, true);
		assert.equal(Math.abs(stats.normalProbabilityDensity(2.32, 2, 0.3) - 0.6140869194) < threshhold, true);
		assert.equal(Math.abs(stats.normalProbabilityDensity(3.14, 4.7, 3.2) - 0.1524735809) < threshhold, true);
	});

	it("should return undefined if variance is negative", () => {
		assert.equal(stats.normalDistribution(0, -1.3), undefined);
		assert.equal(stats.normalProbabilityDensity(2, 1, -4), undefined);
	});

	it("should return undefined if no x is given", () => {
		assert.equal(stats.normalProbabilityDensity(), undefined);
	});
});


/****************************************************************
	Normal cumulative distribution
 ****************************************************************/

describe(".normalCumulativeDistribution() and .normalCumulativeValue()", () => {
	it("should compute the correct values", () => {
		let distrib = stats.normalCumulativeDistribution();

		assert.equal(typeof distrib, 'object');
		assert.equal(Math.abs(distrib['0.00'] - 0.5) < threshhold, true);
		assert.equal(Math.abs(distrib['2.57'] - 0.99492) < threshhold, true);
		assert.equal(Math.abs(distrib['3.94'] - 0.99996) < threshhold, true);

		assert.equal(Math.abs(stats.normalCumulativeValue(0.41) - 0.65910) < threshhold, true);
		assert.equal(Math.abs(stats.normalCumulativeValue(2.32) - 0.98983) < threshhold, true);
		assert.equal(Math.abs(stats.normalCumulativeValue(3.14) - 0.99916) < threshhold, true);
	});

	it("should return undefined if no z is given", () => {
		assert.equal(stats.normalCumulativeValue(), undefined);
	});
});


/****************************************************************
	Poisson distribution
 ****************************************************************/

describe(".poissonDistribution() and .poissonProbabilityMass()", () => {
	it("should compute the correct value", () => {
		let distrib = stats.poissonDistribution(2),
			distrib2 = stats.poissonDistribution(4.3),
			distrib3 = stats.poissonDistribution(0.3);

		assert.equal(typeof distrib, 'object');
		assert.equal(Math.abs(distrib[0] - 0.1353352832) < threshhold, true);
		assert.equal(Math.abs(distrib[2] - 0.2706705664) < threshhold, true);

		assert.equal(typeof distrib2, 'object');
		assert.equal(Math.abs(distrib2[1] - 0.0583448037) < threshhold, true);
		assert.equal(Math.abs(distrib2[3] - 0.1797992368) < threshhold, true);

		assert.equal(typeof distrib3, 'object');
		assert.equal(Math.abs(distrib3[2] - 0.0333368199) < threshhold, true);
		assert.equal(Math.abs(distrib3[4] - 0.0002500261) < threshhold, true);

		assert.equal(Math.abs(stats.poissonProbabilityMass(4) - 0.0153283100) < threshhold, true);
		assert.equal(Math.abs(stats.poissonProbabilityMass(2, 2) - 0.2706705664) < threshhold, true);
		assert.equal(Math.abs(stats.poissonProbabilityMass(3, 4.7) - 0.1573831590) < threshhold, true);

	});

	it("should return undefined if lambda is not positive", () => {
		assert.equal(stats.poissonDistribution(0), undefined);
		assert.equal(stats.poissonDistribution(-3), undefined);
		assert.equal(stats.poissonProbabilityMass(2, 0), undefined);
		assert.equal(stats.poissonProbabilityMass(2, -3), undefined);
	});

	it("should return undefined if no, a negative or a non-integer k is given", () => {
		assert.equal(stats.poissonProbabilityMass(-4), undefined);
		assert.equal(stats.poissonProbabilityMass(0.3), undefined);
		assert.equal(stats.poissonProbabilityMass(), undefined);
	});
});


/****************************************************************
	Poisson cumulative distribution
 ****************************************************************/

describe(".poissonCumulativeDistribution() and .poissonCumulativeValue()", () => {
	it("should compute the correct value", () => {
		let distrib = stats.poissonCumulativeDistribution(2),
			distrib2 = stats.poissonCumulativeDistribution(4.3),
			distrib3 = stats.poissonCumulativeDistribution(0.3);

		assert.equal(typeof distrib, 'object');
		assert.equal(Math.abs(distrib[0] - 0.1353352832) < threshhold, true);
		assert.equal(Math.abs(distrib[2] - 0.6766764161) < threshhold, true);

		assert.equal(typeof distrib2, 'object');
		assert.equal(Math.abs(distrib2[1] - 0.0719133627) < threshhold, true);
		assert.equal(Math.abs(distrib2[3] - 0.3771539277) < threshhold, true);

		assert.equal(typeof distrib3, 'object');
		assert.equal(Math.abs(distrib3[2] - 0.9964005068) < threshhold, true);
		assert.equal(Math.abs(distrib3[4] - 0.9999842149) < threshhold, true);

		assert.equal(Math.abs(stats.poissonCumulativeValue(4) - 0.9963401531) < threshhold, true);
		assert.equal(Math.abs(stats.poissonCumulativeValue(2, 2) - 0.6766764161) < threshhold, true);
		assert.equal(Math.abs(stats.poissonCumulativeValue(3, 4.7) - 0.3096835741) < threshhold, true);

	});

	it("should return undefined if lambda is not positive", () => {
		assert.equal(stats.poissonCumulativeDistribution(0), undefined);
		assert.equal(stats.poissonCumulativeDistribution(-3), undefined);
		assert.equal(stats.poissonCumulativeValue(2, 0), undefined);
		assert.equal(stats.poissonCumulativeValue(2, -3), undefined);
	});

	it("should return undefined if no, a negative or a non-integer k is given", () => {
		assert.equal(stats.poissonCumulativeValue(-4), undefined);
		assert.equal(stats.poissonCumulativeValue(0.3), undefined);
		assert.equal(stats.poissonCumulativeValue(), undefined);
	});
});


/****************************************************************
	Binomial distribution
 ****************************************************************/

describe(".binomialDistribution() and .binomialProbabilityMass()", () => {
	it("should compute the correct value", () => {
		let distrib = stats.binomialDistribution(12, 0.3),
			distrib2 = stats.binomialDistribution(16, 0.6),
			distrib3 = stats.binomialDistribution(4, 0.8);

		assert.equal(typeof distrib, 'object');
		assert.equal(Math.abs(distrib[2] - 0.1677902979) < threshhold, true);
		assert.equal(Math.abs(distrib[4] - 0.231139696095) < threshhold, true);

		assert.equal(typeof distrib2, 'object');
		assert.equal(Math.abs(distrib2[8] - 0.1416669293) < threshhold, true);
		assert.equal(Math.abs(distrib2[12] - 0.1014206425) < threshhold, true);

		assert.equal(typeof distrib3, 'object');
		assert.equal(Math.abs(distrib3[2] - 0.1536) < threshhold, true);
		assert.equal(Math.abs(distrib3[4] - 0.4096) < threshhold, true);

		assert.equal(Math.abs(stats.binomialProbabilityMass(4, 7, 0.3) - 0.0972405) < threshhold, true);
		assert.equal(Math.abs(stats.binomialProbabilityMass(2, 2, 0.01) - 0.0001) < threshhold, true);
		assert.equal(Math.abs(stats.binomialProbabilityMass(12, 22, 0.2) - 0.0002843979) < threshhold, true);

	});

	it("should return undefined if probability is larger than 1 or smaller than 0", () => {
		assert.equal(stats.binomialDistribution(12, -0.1), undefined);
		assert.equal(stats.binomialDistribution(10, 1.2), undefined);
		assert.equal(stats.binomialProbabilityMass(3, 2, -0.3), undefined);
		assert.equal(stats.binomialProbabilityMass(3, 2, 1.4), undefined);
	});

	it("should return undefined if n is negative or non-integer", () => {
		assert.equal(stats.binomialDistribution(-3), undefined);
		assert.equal(stats.binomialDistribution(1.2), undefined);
		assert.equal(stats.binomialProbabilityMass(2, 2.4), undefined);
		assert.equal(stats.binomialProbabilityMass(2, -1.4), undefined);
	});

	it("should return undefined if no, a negative or a non-integer k is given", () => {
		assert.equal(stats.binomialProbabilityMass(-4), undefined);
		assert.equal(stats.binomialProbabilityMass(0.3), undefined);
		assert.equal(stats.binomialProbabilityMass(), undefined);
	});
});


/****************************************************************
	Binomial cumulative distribution
 ****************************************************************/

describe(".binomialCumulativeDistribution() and .binomialCumulativeValue()", () => {
	it("should compute the correct value", () => {
		let distrib = stats.binomialCumulativeDistribution(12, 0.3),
			distrib2 = stats.binomialCumulativeDistribution(16, 0.6),
			distrib3 = stats.binomialCumulativeDistribution(4, 0.8);

		assert.equal(typeof distrib, 'object');
		assert.equal(Math.abs(distrib[2] - 0.2528153478) < threshhold, true);
		assert.equal(Math.abs(distrib[4] - 0.72365546953) < threshhold, true);

		assert.equal(typeof distrib2, 'object');
		assert.equal(Math.abs(distrib2[8] - 0.2839366472) < threshhold, true);
		assert.equal(Math.abs(distrib2[12] - 0.9348532582) < threshhold, true);

		assert.equal(typeof distrib3, 'object');
		assert.equal(Math.abs(distrib3[2] - 0.1808) < threshhold, true);
		assert.equal(Math.abs(distrib3[4] - 1) < threshhold, true);

		assert.equal(Math.abs(stats.binomialCumulativeValue(10, 20, 0.5) - 0.5880985260) < threshhold, true);
		assert.equal(Math.abs(stats.binomialCumulativeValue(5, 20, 0.2) - 0.8042077854) < threshhold, true);
		assert.equal(Math.abs(stats.binomialCumulativeValue(5, 10, 0.8) - 0.0327934976) < threshhold, true);

	});

	it("should return undefined if probability is larger than 1 or smaller than 0", () => {
		assert.equal(stats.binomialCumulativeDistribution(12, -0.1), undefined);
		assert.equal(stats.binomialCumulativeDistribution(10, 1.2), undefined);
		assert.equal(stats.binomialCumulativeValue(3, 2, -0.3), undefined);
		assert.equal(stats.binomialCumulativeValue(3, 2, 1.4), undefined);
	});

	it("should return undefined if n is negative or non-integer", () => {
		assert.equal(stats.binomialCumulativeDistribution(-3), undefined);
		assert.equal(stats.binomialCumulativeDistribution(1.2), undefined);
		assert.equal(stats.binomialCumulativeValue(2, 2.4), undefined);
		assert.equal(stats.binomialCumulativeValue(2, -1.4), undefined);
	});

	it("should return undefined if no, a negative or a non-integer k is given", () => {
		assert.equal(stats.binomialCumulativeValue(-4), undefined);
		assert.equal(stats.binomialCumulativeValue(0.3), undefined);
		assert.equal(stats.binomialCumulativeValue(), undefined);
	});
});


/****************************************************************
	Student's t distribution
 ****************************************************************/

describe(".studentsTDistribution() and .studentsTProbabilityDensity()", () => {
	it("should compute the correct value", () => {
		let distrib = stats.studentsTDistribution(12),
			distrib2 = stats.studentsTDistribution(16),
			distrib3 = stats.studentsTDistribution(4);

		assert.equal(typeof distrib, 'object');
		assert.equal(Math.abs(distrib['0.00'] - 0.3907263052) < threshhold, true);
		assert.equal(Math.abs(distrib['2.57'] - 0.0225929551) < threshhold, true);

		assert.equal(typeof distrib2, 'object');
		assert.equal(Math.abs(distrib2['1.04'] - 0.2252453367) < threshhold, true);
		assert.equal(Math.abs(distrib2['3.01'] - 0.0086655207) < threshhold, true);

		assert.equal(typeof distrib3, 'object');
		assert.equal(Math.abs(distrib3['2.24'] - 0.0491421132) < threshhold, true);
		assert.equal(Math.abs(distrib3['4.62'] - 0.0037108740) < threshhold, true);

		assert.equal(Math.abs(stats.studentsTProbabilityDensity(4.1, 7) - 0.0028761111) < threshhold, true);
		assert.equal(Math.abs(stats.studentsTProbabilityDensity(2.03, 2) - 0.0660354396) < threshhold, true);
		assert.equal(Math.abs(stats.studentsTProbabilityDensity(0.01, 22) - 0.3944154282) < threshhold, true);

	});

	it("should return undefined if df is negative", () => {
		assert.equal(stats.studentsTDistribution(-3), undefined);
		assert.equal(stats.studentsTProbabilityDensity(2, -1.4), undefined);
	});

	it("should return undefined if no df is given", () => {
		assert.equal(stats.studentsTDistribution(), undefined);
		assert.equal(stats.studentsTProbabilityDensity(3), undefined);
		assert.equal(stats.studentsTProbabilityDensity(), undefined);
	});
});



/****************************************************************
	Student's t cumulative distribution
 ****************************************************************/

describe(".studentsTCumulativeDistribution() and .studentsTCumulativeValue()", () => {
	it("should compute the correct value", () => {
		let distrib = stats.studentsTCumulativeDistribution(12),
			distrib2 = stats.studentsTCumulativeDistribution(16),
			distrib3 = stats.studentsTCumulativeDistribution(4);

		assert.equal(typeof distrib, 'object');
		assert.equal(Math.abs(distrib['0.00'] - 0.5) < threshhold, true);
		assert.equal(Math.abs(distrib['2.57'] - 0.98772721) < threshhold, true);

		assert.equal(typeof distrib2, 'object');
		assert.equal(Math.abs(distrib2['1.04'] - 0.84309927) < threshhold, true);
		assert.equal(Math.abs(distrib2['3.01'] - 0.99584780) < threshhold, true);

		assert.equal(typeof distrib3, 'object');
		assert.equal(Math.abs(distrib3['2.24'] - 0.95568903) < threshhold, true);
		assert.equal(Math.abs(distrib3['4.62'] - 0.99505945) < threshhold, true);

		assert.equal(Math.abs(stats.studentsTCumulativeValue(4.1, 7) - 0.99771348) < threshhold, true);
		assert.equal(Math.abs(stats.studentsTCumulativeValue(2.03, 2) - 0.91025927) < threshhold, true);
		assert.equal(Math.abs(stats.studentsTCumulativeValue(0.01, 22) - 0.50394429) < threshhold, true);

	});

	it("should return undefined if df is negative", () => {
		assert.equal(stats.studentsTCumulativeDistribution(-3), undefined);
		assert.equal(stats.studentsTCumulativeValue(2, -1.4), undefined);
	});

	it("should return undefined if no df is given", () => {
		assert.equal(stats.studentsTCumulativeDistribution(), undefined);
		assert.equal(stats.studentsTCumulativeValue(3), undefined);
		assert.equal(stats.studentsTCumulativeValue(), undefined);
	});
});


/****************************************************************
	Chi squared distribution
 ****************************************************************/

describe(".chiSquaredDistribution() and .chiSquaredProbabilityDensity()", () => {
	it("should compute the correct value", () => {
		let distrib = stats.chiSquaredDistribution(12),
			distrib2 = stats.chiSquaredDistribution(9),
			distrib3 = stats.chiSquaredDistribution(4);

		assert.equal(typeof distrib, 'object');
		assert.equal(Math.abs(distrib['2.42'] - 0.0032226956) < threshhold, true);
		assert.equal(Math.abs(distrib['4.57'] - 0.0264153816) < threshhold, true);

		assert.equal(typeof distrib2, 'object');
		assert.equal(Math.abs(distrib2['10.04'] - 0.08046934428) < threshhold, true);
		assert.equal(Math.abs(distrib2['30.01'] - 0.00017122337) < threshhold, true);

		assert.equal(typeof distrib3, 'object');
		assert.equal(Math.abs(distrib3['20.24'] - 0.0002037465) < threshhold, true);
		assert.equal(Math.abs(distrib3['4.62']  - 0.1146467455) < threshhold, true);

		assert.equal(Math.abs(stats.chiSquaredProbabilityDensity(7, 4.1) - 0.0550406566) < threshhold, true);
		assert.equal(Math.abs(stats.chiSquaredProbabilityDensity(2, 2.03) - 0.1855051449) < threshhold, true);
		assert.equal(Math.abs(stats.chiSquaredProbabilityDensity(22, 10.4) - 0.0060625353) < threshhold, true);

	});

	it("should return undefined if df is negative", () => {
		assert.equal(stats.chiSquaredDistribution(-3), undefined);
		assert.equal(stats.chiSquaredProbabilityDensity(2, -1), undefined);
	});

	it("should return undefined if no df is given", () => {
		assert.equal(stats.chiSquaredDistribution(), undefined);
		assert.equal(stats.chiSquaredProbabilityDensity(3), undefined);
		assert.equal(stats.chiSquaredProbabilityDensity(), undefined);
	});
});


/****************************************************************
	Chi squared cumulative distribution
 ****************************************************************/

describe(".chiSquaredCumulativeDistribution() and .chiSquaredCumulativeValue()", () => {
	it("should compute the correct value", () => {
		let distrib = stats.chiSquaredCumulativeDistribution(12),
			distrib2 = stats.chiSquaredCumulativeDistribution(9),
			distrib3 = stats.chiSquaredCumulativeDistribution(4);

		assert.equal(typeof distrib, 'object');

		assert.equal(Math.abs(distrib['2.42'] - 0.0015636764) < threshhold, true);
		assert.equal(Math.abs(distrib['4.57'] - 0.0291761569) < threshhold, true);

		assert.equal(typeof distrib2, 'object');
		assert.equal(Math.abs(distrib2['10.04'] - 0.65274329724) < threshhold, true);
		assert.equal(Math.abs(distrib2['30.01'] - 0.99956299374) < threshhold, true);

		assert.equal(typeof distrib3, 'object');
		assert.equal(Math.abs(distrib3['20.24'] - 0.9995522406) < threshhold, true);
		assert.equal(Math.abs(distrib3['4.62']  - 0.6714452573) < threshhold, true);

		assert.equal(Math.abs(stats.chiSquaredCumulativeValue(7, 4.1) - 0.8565093678) < threshhold, true);
		assert.equal(Math.abs(stats.chiSquaredCumulativeValue(2, 2.03) - 0.6256486212) < threshhold, true);
		assert.equal(Math.abs(stats.chiSquaredCumulativeValue(22, 10.4) - 0.9815993303) < threshhold, true);

	});

	it("should return undefined if df is negative", () => {
		assert.equal(stats.chiSquaredCumulativeDistribution(-3), undefined);
		assert.equal(stats.chiSquaredCumulativeValue(2, -1), undefined);
	});

	it("should return undefined if no df is given", () => {
		assert.equal(stats.chiSquaredDistribution(), undefined);
		assert.equal(stats.chiSquaredProbabilityDensity(3), undefined);
		assert.equal(stats.chiSquaredProbabilityDensity(), undefined);
	});
});
