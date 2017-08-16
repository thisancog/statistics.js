'use strict';

let assert = require('assert');
let Statistics = require('../statistics.js'),
	options = { suppressWarnings: true };


/********************************
	Fisher's exact test
 ********************************/

describe(".fishersExactTest()", () => {
		// www2.fiu.edu/~howellip/Fisher.pdf
	let example1Values = Array(9).fill( { grade: 'pass', college: 'crane' })
				.concat( Array(13).fill({ grade: 'fail', college: 'crane' }))
				.concat( Array(4).fill( { grade: 'fail', college: 'egret'})),
		example1Vars = { 'grade': { scale: 'nominal', valueMap: ['pass', 'fail'] }, 'college': { scale: 'nominal', valueMap: ['crane', 'egret'] } },

		// https://en.wikipedia.org/wiki/Fisher%27s_exact_test#Example
		example2Values = Array(1).fill( { studying: 'yes', gender: 'm' })
				.concat( Array(11).fill({ studying: 'no', gender: 'm' }))
				.concat( Array(9).fill( { studying: 'yes', gender: 'f' }))
				.concat( Array(3).fill( { studying: 'no', gender: 'f'})),
		example2Vars = { 'studying': { scale: 'nominal', valueMap: ['yes', 'no'] }, 'gender': { scale: 'nominal', valueMap: ['m', 'f'] } };


	let stats1 = new Statistics(example1Values, example1Vars, options),
		stats2 = new Statistics(example2Values, example2Vars, options),
		threshhold = stats1.epsilon;

	it("should compute the correct value for several examples", () => {
		assert.equal(Math.abs(stats1.fishersExactTest('grade', 'college') - 0.159197) < threshhold, true);
		assert.equal(Math.abs(stats2.fishersExactTest('studying', 'gender') - 0.001346076) < threshhold, true);
	});

	it("should return undefined if only one or no columns are given", () => {
		assert.equal(stats1.fishersExactTest('grade'), undefined);
		assert.equal(stats1.fishersExactTest(), undefined);
	});
});


/********************************
	Bernard's exact test
 ********************************/

describe(".barnardsTest()", () => {
		// https://www.r-statistics.com/2010/02/barnards-exact-test-a-powerful-alternative-for-fishers-exact-test-implemented-in-r/
	let example1Values = Array(2).fill( { cell: 'monozygotic', convicted: 'yes' })
				.concat( Array(10).fill({ cell: 'monozygotic', convicted: 'no' }))
				.concat( Array(15).fill({ cell: 'dizygotic', convicted: 'yes' }))
				.concat( Array(3).fill( { cell: 'dizygotic', convicted: 'no' })),
		example2Values = Array(7).fill( { cell: 'monozygotic', convicted: 'yes' })
				.concat( Array(3).fill({ cell: 'monozygotic', convicted: 'no' }))
				.concat( Array(1).fill({ cell: 'dizygotic', convicted: 'yes' }))
				.concat( Array(9).fill( { cell: 'dizygotic', convicted: 'no' })),
		exampleVars = { cell: { scale: 'nominal', valueMap: ['monozygotic', 'dizygotic'] }, convicted: { scale: 'nominal', valueMap: ['yes', 'no'] } };


	let stats1 = new Statistics(example1Values, exampleVars, options),
		stats2 = new Statistics(example2Values, exampleVars, options),
		result1 = stats1.barnardsTest('cell', 'convicted'),
		result2 = stats2.barnardsTest('cell', 'convicted'),
		threshhold = stats1.epsilon;

	it("should compute the correct value for several examples", () => {
		assert.equal(Math.abs(result1.wald - 3.609941) < threshhold, true);
		assert.equal(Math.abs(result1.nuisance - 0.44446) < 0.01, true);		// not as much precision required as steps for nuisance are larger
		assert.equal(Math.abs(result1.pOneTailed - 0.0001528846) < threshhold, true);

		assert.equal(Math.abs(result2.wald + 2.738613) < threshhold, true);
		assert.equal(Math.abs(result2.nuisance - 0.510100) < 0.01, true);		// not as much precision required as steps for nuisance are larger
		assert.equal(Math.abs(result2.pOneTailed - 0.0034735) < threshhold, true);
	});

	it("should return undefined if only one or no columns are given", () => {
		assert.equal(stats1.barnardsTest('grade'), undefined);
		assert.equal(stats1.barnardsTest(), undefined);
	});
});


/********************************
	Binomial test
 ********************************/

describe(".binomialTest()", () => {
		// https://www.statstodo.com/BinomialTest_Exp.php
	let example1Values = Array(3).fill( { survival: 'yes' })
				.concat( Array(5).fill({ survival: 'no' })),
		example2Values = Array(13).fill( { survival: 'yes' })
				.concat( Array(4).fill({ survival: 'no' })),
		exampleVars = { survival: { scale: 'nominal', valueMap: ['yes', 'no'] } };

	let stats1 = new Statistics(example1Values, exampleVars, options),
		stats2 = new Statistics(example2Values, exampleVars, options),
		result1 = stats1.binomialTest('survival', 'no', 0.14),
		result2 = stats2.binomialTest('survival', 'no', 0.12),
		threshhold = stats1.epsilon;

	it("should compute the correct value for several examples", () => {
		assert.equal(Math.abs(result1.pAtMost - 0.99983667) < threshhold, true);
		assert.equal(Math.abs(result1.pAtLeast - 0.00207901) < threshhold, true);
		assert.equal(Math.abs(result2.pAtMost - 0.95541265) < threshhold, true);
		assert.equal(Math.abs(result2.pAtLeast - 0.13825221) < threshhold, true);
	});

	it("should return undefined if only no column or no valueToTest is given", () => {
		assert.equal(stats1.binomialTest(), undefined);
		assert.equal(stats1.binomialTest('survival'), undefined);
	});
});


/********************************
	Sign test
 ********************************/

describe(".signTest()", () => {
	//	https://en.wikipedia.org/wiki/Sign_test#Example_of_two-sided_sign_test_for_matched_pairs
	let example1Values = [
			{ hind: 142, fore: 138 },
			{ hind: 140, fore: 136 },
			{ hind: 144, fore: 147 },
			{ hind: 144, fore: 139 },
			{ hind: 142, fore: 143 },
			{ hind: 146, fore: 141 },
			{ hind: 149, fore: 143 },
			{ hind: 150, fore: 145 },
			{ hind: 142, fore: 136 },
			{ hind: 148, fore: 146 }
		],
	//	https://de.wikipedia.org/wiki/Vorzeichentest#Beispiel_f.C3.BCr_ein_Zweistichprobenproblem
		example2Values = Array(25).fill({ a: 0, b: 1 })
				 .concat(Array(11).fill({ a: 1, b: 0 }))
				 .concat(Array(7 ).fill({ a: 0, b: 0 })),
		example1Vars = { hind: 'metric', fore: 'metric' },
		example2Vars = { a: 'metric', b: 'metric' };

	let stats1 = new Statistics(example1Values, example1Vars, options),
		stats2 = new Statistics(example2Values, example2Vars, options),
		result1 = stats1.signTest('hind', 'fore'),
		result2 = stats2.signTest('b', 'a'),
		threshhold = stats1.epsilon;

	it("should compute the correct value for several examples", () => {
		assert.equal(Math.abs(result1.pAtLeast * 2 - 0.109375) < threshhold, true);
		assert.equal(result1.positives, 8);
		assert.equal(Math.abs(result2.pExactly - 0.069162416) < threshhold, true);
		assert.equal(result2.positives, 25);
	});

	it("should return undefined if only no or no existing column is given", () => {
		assert.equal(stats1.signTest(), undefined);
		assert.equal(stats1.signTest('abc'), undefined);
	});
});


/********************************
	Chi squared test
 ********************************/

describe(".chiSquaredTest()", () => {
	//	https://en.wikipedia.org/wiki/Chi-squared_test#Example_chi-squared_test_for_categorical_data
	let example1Values = Array(90).fill({ neighbourhood: 'A', income: 'white' })
				 .concat(Array(30).fill({ neighbourhood: 'A', income: 'blue' }))
				 .concat(Array(30).fill({ neighbourhood: 'A', income: 'no' }))
				 .concat(Array(60).fill({ neighbourhood: 'B', income: 'white' }))
				 .concat(Array(50).fill({ neighbourhood: 'B', income: 'blue' }))
				 .concat(Array(40).fill({ neighbourhood: 'B', income: 'no' }))
				 .concat(Array(104).fill({ neighbourhood: 'C', income: 'white' }))
				 .concat(Array(51).fill({ neighbourhood: 'C', income: 'blue' }))
				 .concat(Array(45).fill({ neighbourhood: 'C', income: 'no' }))
				 .concat(Array(95).fill({ neighbourhood: 'D', income: 'white' }))
				 .concat(Array(20).fill({ neighbourhood: 'D', income: 'blue' }))
				 .concat(Array(35).fill({ neighbourhood: 'D', income: 'no' })),
		example1Vars = { neighbourhood: { scale: 'nominal', valueMap: ['A', 'B', 'C', 'D'] }, income: { scale: 'nominal', valueMap: ['white', 'blue', 'no'] } },
		//	http://stattrek.com/chi-square-test/independence.aspx?Tutorial=AP
		example2Values = Array(200).fill({ gender: 'male', voting: 'republican' })
				 .concat(Array(150).fill({ gender: 'male', voting: 'democrat' }))
				 .concat(Array(50).fill({ gender: 'male', voting: 'independent' }))
				 .concat(Array(250).fill({ gender: 'female', voting: 'republican' }))
				 .concat(Array(300).fill({ gender: 'female', voting: 'democrat' }))
				 .concat(Array(50).fill({ gender: 'female', voting: 'independent' })),
		example2Vars = { gender: { scale: 'nominal', valueMap: ['male', 'female'] }, voting: { scale: 'nominal', valueMap: ['republican', 'democrat', 'independent'] } };

	let stats1 = new Statistics(example1Values, example1Vars, options),
		stats2 = new Statistics(example2Values, example2Vars, options),
		result1 = stats1.chiSquaredTest('neighbourhood', 'income'),
		result2 = stats2.chiSquaredTest('gender', 'voting'),
		threshhold = stats1.epsilon;

	it("should compute the correct value for several examples", () => {
		assert.equal(Math.abs(result1.PearsonChiSquared - 24.57120285) < threshhold, true);
		assert.equal(Math.abs(result1.significance - 0.0004098425) < threshhold, true);
		assert.equal(result1.degreesOfFreedom, 6);
		assert.equal(Math.abs(result2.PearsonChiSquared - 16.2037037) < threshhold, true);
		assert.equal(Math.abs(result2.significance - 0.0003029775) < threshhold, true);
		assert.equal(result2.degreesOfFreedom, 2);
	});

	it("should return undefined if only no or no existing column is given", () => {
		assert.equal(stats1.chiSquaredTest(), undefined);
		assert.equal(stats1.chiSquaredTest('abc'), undefined);
	});
});


/********************************
	Mann-Whitney U
 ********************************/

describe(".mannWhitneyU()", () => {
	//	http://www.methodenberatung.uzh.ch/de/datenanalyse/unterschiede/zentral/mann.html
	let example1Values = [
			{ group: 'a', wellness: 0 },
			{ group: 'b', wellness: 1 },
			{ group: 'b', wellness: 2 },
			{ group: 'b', wellness: 3 },
			{ group: 'b', wellness: 4 },
			{ group: 'a', wellness: 5 },
			{ group: 'a', wellness: 5.5 },
			{ group: 'b', wellness: 6 },
			{ group: 'b', wellness: 6.5 },
			{ group: 'a', wellness: 7 },
			{ group: 'b', wellness: 7.5 },
			{ group: 'a', wellness: 8 },
			{ group: 'b', wellness: 8.5 },
			{ group: 'a', wellness: 9 },
			{ group: 'a', wellness: 11 },
			{ group: 'a', wellness: 13 },
			{ group: 'a', wellness: 28 },
			{ group: 'a', wellness: 29 },
			{ group: 'a', wellness: 32 },
			{ group: 'a', wellness: 33 },
		],
		example1Vars = { group: 'nominal', wellness: 'metric' },
		//	https://de.wikipedia.org/wiki/Wilcoxon-Mann-Whitney-Test#Beispiel
		example2Values = [
			{ gender: 'male', income: 0 },
			{ gender: 'female', income: 400 },
			{ gender: 'male', income: 500 },
			{ gender: 'female', income: 550 },
			{ gender: 'male', income: 600 },
			{ gender: 'female', income: 650 },
			{ gender: 'male', income: 750 },
			{ gender: 'male', income: 800 },
			{ gender: 'female', income: 900 },
			{ gender: 'female', income: 950 },
			{ gender: 'male', income: 1000 },
			{ gender: 'male', income: 1100 },
			{ gender: 'female', income: 1200 },
			{ gender: 'male', income: 1500 },
			{ gender: 'female', income: 1600 },
			{ gender: 'male', income: 1800 },
			{ gender: 'male', income: 1900 },
			{ gender: 'male', income: 2000 },
			{ gender: 'male', income: 2200 },
			{ gender: 'male', income: 3500 }
		],
		example2Vars = { gender: 'nominal', income: 'metric' };

	let stats1 = new Statistics(example1Values, example1Vars, options),
		stats2 = new Statistics(example2Values, example2Vars, options),
		result1 = stats1.mannWhitneyU('group', 'wellness'),
		result2 = stats2.mannWhitneyU('gender', 'income'),
		threshhold = stats1.epsilon;

	it("should compute the correct value for several examples", () => {
		assert.equal(Math.abs(result1.pOneTailed - 0.01263) < threshhold, true);
		assert.equal(Math.abs(result1.zScore + 2.2373985744) < threshhold, true);
		assert.equal(result1.MannWhitneyU, 19);

		assert.equal(Math.abs(result2.pOneTailed - 0.125273) < threshhold, true);
		assert.equal(Math.abs(result2.zScore + 1.1490218350) < threshhold, true);
		assert.equal(result2.MannWhitneyU, 31);
	});

	it("should return undefined if only no or no existing column is given", () => {
		assert.equal(stats1.mannWhitneyU(), undefined);
		assert.equal(stats1.mannWhitneyU('abc'), undefined);
	});
});