'use strict';

let assert = require('assert');
let Statistics = require('../statistics.js'),
	testVar = [
		{ a: 1, b: 1, c: 6, d: 1, e: 4, f: 3 },
		{ a: 2, b: 2, c: 5, d: 1, e: 3, f: 7 },
		{ a: 3, b: 3, c: 4, d: 1, f: 9 },
		{ a: 4, b: 4, c: 3, d: 1, e: 7, f: 2 },
		{ a: 5, b: 5, c: 2, d: 1, e: 2, f: 4, },
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
	options = { suppressWarnings: true },
	stats = new Statistics(testVar, testColumns, options),
	statsTooLow = new Statistics([{ a: 1, b: 1 }, { a: 2, b: 3 }, { a: 3, b: 1 }], { a: 'nominal', b: 'nominal' }, options);

let threshhold = stats.epsilon;



/********************************
	Covariance
 ********************************/

describe(".covariance()", () => {
	it("should compute the correct covariance for several numbers", () => {
		assert.equal(Math.abs(stats.covariance('a', 'f').covariance - 2.4) < threshhold, true);
	});

	it("should compute the covariance of two identical variables as the variance", () => {		
		assert.equal(stats.covariance('a', 'a').covariance, 3.5);
		assert.equal(stats.covariance('a', 'a').covariance, stats.variance('a'));
	});

	it("should compute the covariance as 0 if there is no coherence", () => {
		assert.equal(stats.covariance('a', 'd').covariance, 0);
	});

	it("should ignore pairs with missing values", () => {
		assert.equal(Math.abs(stats.covariance('a', 'e').covariance - 4.3125) < threshhold, 0);
		assert.equal(stats.covariance('a', 'e').missings, 1);
	});

	it("should return undefined if one column is missing", () => {
		assert.equal(stats.covariance('a'), undefined);
	});

	it("should return undefined if the scale of measure is too low", () => {
		assert.equal(statsTooLow.covariance('a', 'b'), undefined);
	});
});


/********************************
	Pearson's correlation
 ********************************/

describe(".correlationCoefficient()", () => {
	it("should compute the correct value", () => {
		assert.equal(Math.abs(stats.correlationCoefficient('a', 'f').correlationCoefficient - 0.35856858280032) < threshhold, true);
		assert.equal(stats.correlationCoefficient('a', 'c').correlationCoefficient, -1);
	});

	it("should return 1 if two identical variables are given", () => {		
		assert.equal(stats.correlationCoefficient('a', 'a').correlationCoefficient, 1);
	});

	it("should compute the correlation as 0 if there is no coherence", () => {
		assert.equal(stats.correlationCoefficient('a', 'd').correlationCoefficient, 0);
	});

	it("should ignore pairs with missing values", () => {
		assert.equal(Math.abs(stats.correlationCoefficient('a', 'e').correlationCoefficient - 4.3125) < threshhold, 0);
		assert.equal(stats.correlationCoefficient('a', 'e').missings, 1);
	});

	it("should return undefined if one column is missing", () => {
		assert.equal(stats.correlationCoefficient('a'), undefined);
	});

	it("should return undefined if the scale of measure is too low", () => {
		assert.equal(statsTooLow.correlationCoefficient('a', 'b'), undefined);
	});
});



/********************************
	Fisher transformation
 ********************************/

describe(".fisherTransformation()", () => {
	it("should compute the correct value", () => {
		assert.equal(Math.abs(stats.fisherTransformation(0.1) - Math.atanh(0.1)) < threshhold, true);
		assert.equal(Math.abs(stats.fisherTransformation(0.3) - Math.atanh(0.3)) < threshhold, true);
		assert.equal(Math.abs(stats.fisherTransformation(0.7) - Math.atanh(0.7)) < threshhold, true);
		assert.equal(Math.abs(stats.fisherTransformation(-0.3) - Math.atanh(-0.3)) < threshhold, true);
	});

	it("should return 0 if the argument is 0", () => {		
		assert.equal(stats.fisherTransformation(0), 0);
	});

	it("should return Infinity/-Infinity if the argument is 1/-1", () => {		
		assert.equal(stats.fisherTransformation(1), Infinity);
		assert.equal(stats.fisherTransformation(-1), -Infinity);
	});

	it("should return undefined if the argument is smaller than -1 or larger than 1", () => {
		assert.equal(stats.fisherTransformation(-3), undefined);
		assert.equal(stats.fisherTransformation(1.001), undefined);
	});

	it("should return undefined if no or an non-numeric argument is given", () => {
		assert.equal(statsTooLow.fisherTransformation(), undefined);
		assert.equal(statsTooLow.fisherTransformation("a"), undefined);
	});
});



/********************************
	Goodman and Kruskal's Gamma
 ********************************/

describe(".goodmanKruskalsGamma()", () => {
	let example1Values = [	// concordants: 33, discordants: 5
			{ satisfaction: 1, income: 1 },
			{ satisfaction: 2, income: 3 },
			{ satisfaction: 3, income: 4 },
			{ satisfaction: 4, income: 2 },
			{ satisfaction: 5, income: 5 },
			{ satisfaction: 1, income: 1 },
			{ satisfaction: 2, income: 2 },
			{ satisfaction: 3, income: 4 },
			{ satisfaction: 4, income: 3 },
			{ satisfaction: 5, income: 5 }
		],
		example1Vars = { satisfaction: 'ordinal', income: 'ordinal' };

	let stats1 = new Statistics(example1Values, example1Vars, options),
		result1 = stats1.goodmanKruskalsGamma('satisfaction', 'income');

	it("should compute the correct value for several examples", () => {		// I actually calculated these by hand)
		assert.equal(Math.abs(result1.gamma - 0.73684211) < threshhold, true);
		assert.equal(Math.abs(result1.tStatistic - 2.12460335) < threshhold, true);
		assert.equal(Math.abs(result1.pOneTailed - 0.033174030) < threshhold, true);
	});

	it("should return undefined if only one or no columns are at least ordinal", () => {
		assert.equal(statsTooLow.goodmanKruskalsGamma('a', 'b'), undefined);
	});

	it("should return undefined if only one or no columns are given", () => {
		assert.equal(stats1.goodmanKruskalsGamma('a'), undefined);
		assert.equal(stats1.goodmanKruskalsGamma(), undefined);
	});
});


/********************************
	Spearman's Rho
 ********************************/

describe(".spearmansRho()", () => {
		// https://en.wikipedia.org/wiki/Spearman%27s_rank_correlation_coefficient#Example
	let example1Values = [
			{ iq: 106, hours: 7 },
			{ iq: 86, hours: 0 },
			{ iq: 100, hours: 27 },
			{ iq: 101, hours: 50 },
			{ iq: 99, hours: 28 },
			{ iq: 103, hours: 29 },
			{ iq: 97, hours: 20 },
			{ iq: 113, hours: 12 },
			{ iq: 112, hours: 6 },
			{ iq: 110, hours: 17 }
		],
		example1Vars = { iq: 'metric', hours: 'metric' };


	let stats1 = new Statistics(example1Values, example1Vars, options),
		result1 = stats1.spearmansRho('iq', 'hours');

	it("should compute the correct value for several examples", () => {
		assert.equal(Math.abs(result1.rho + 0.175757575757) < threshhold, true);
		assert.equal(Math.abs(result1.significanceStudent.tStatistic + 0.504978249) < threshhold, true);
		assert.equal(Math.abs(result1.significanceStudent.pTwoTailed - 0.627188) < threshhold, true);
		assert.equal(result1.significanceStudent.degreesOfFreedom, 8);
	});

	it("should return undefined if only one or no columns are at least ordinal", () => {
		assert.equal(statsTooLow.spearmansRho('a', 'b'), undefined);
	});

	it("should return undefined if only one or no columns are given", () => {
		assert.equal(stats1.spearmansRho('a'), undefined);
		assert.equal(stats1.spearmansRho(), undefined);
	});
});



/********************************
	Kendall's Tau
 ********************************/

describe(".kendallsTau()", () => {
		// http://www.statisticshowto.com/kendalls-tau/
	let example1Values = [
			{ interviewer1: 1, interviewer2: 1 },
			{ interviewer1: 2, interviewer2: 2 },
			{ interviewer1: 3, interviewer2: 4 },
			{ interviewer1: 4, interviewer2: 3 },
			{ interviewer1: 5, interviewer2: 6 },
			{ interviewer1: 6, interviewer2: 5 },
			{ interviewer1: 7, interviewer2: 8 },
			{ interviewer1: 8, interviewer2: 7 },
			{ interviewer1: 9, interviewer2: 10 },
			{ interviewer1: 10, interviewer2: 9 },
			{ interviewer1: 11, interviewer2: 12 },
			{ interviewer1: 12, interviewer2: 11 }
		],
		example1Vars = { interviewer1: 'ordinal', interviewer2: 'ordinal' },
		// http://www.brynmawr.edu/socialwork/GSSW/Vartanian/Handouts/Kendall2.hnd.PDF
		example2Values = [
			{ grade: 1, iq: 1 },
			{ grade: 2, iq: 4 },
			{ grade: 3, iq: 3 },
			{ grade: 4, iq: 5 },
			{ grade: 5, iq: 2 },
		],
		example2Vars = { grade: 'ordinal', iq: 'metric' };


	let stats1 = new Statistics(example1Values, example1Vars, options),
		stats2 = new Statistics(example2Values, example2Vars, options),
		result1 = stats1.kendallsTau('interviewer1', 'interviewer2'),
		result2 = stats2.kendallsTau('grade', 'iq');

	it("should compute the correct value for several examples", () => {
		assert.equal(Math.abs(result1.a.tauA - 0.848484848) < threshhold, true);
		assert.equal(Math.abs(result1.b.tauB - 0.848484848) < threshhold, true);
		assert.equal(Math.abs(result1.a.z - 3.8400627) < threshhold, true);
		assert.equal(Math.abs(result1.b.z - 3.8400627) < threshhold, true);
		assert.equal(Math.abs(result1.a.pOneTailed - 0.00006) < threshhold, true);
		assert.equal(Math.abs(result1.b.pOneTailed - 0.00006) < threshhold, true);

		assert.equal(Math.abs(result2.a.tauA - 0.2) < threshhold, true);
		assert.equal(Math.abs(result2.b.tauB - 0.2) < threshhold, true);
		assert.equal(Math.abs(result2.a.z - 0.489897949) < threshhold, true);
		assert.equal(Math.abs(result2.b.z - 0.489897949) < threshhold, true);
		assert.equal(Math.abs(result2.a.pOneTailed - 0.31210) < threshhold, true);
		assert.equal(Math.abs(result2.b.pOneTailed - 0.31210) < threshhold, true);
	});

	it("should return undefined if only one or no columns are at least ordinal", () => {
		assert.equal(statsTooLow.kendallsTau('a', 'b'), undefined);
	});

	it("should return undefined if only one or no columns are given", () => {
		assert.equal(stats1.kendallsTau('a'), undefined);
		assert.equal(stats1.kendallsTau(), undefined);
	});
});
