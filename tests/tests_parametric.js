'use strict';

let assert = require('assert');
let Statistics = require('../statistics.js'),
	options = { suppressWarnings: true };


/********************************
	Student's t-test one sample
 ********************************/

describe(".studentsTTestOneSample()", () => {
	//	https://www.r-bloggers.com/one-sample-students-t-test/
	let example1Values = [ { iq: 65 }, { iq: 78 }, { iq: 88 },
			{ iq: 55 }, { iq: 48 }, { iq: 95 }, { iq: 66 },
			{ iq: 57 }, { iq: 79 }, { iq: 81 } ],
	//	http://www.statsdirect.com/help/parametric_methods/single_sample_t.htm
		example2Values = [ 128, 127, 118, 115, 144, 142, 133, 140, 132, 131, 111, 132, 149, 122, 139, 119, 136, 129, 126, 128 ],
		example1Vars = { iq: 'metric' };

	let stats1 = new Statistics(example1Values, example1Vars, options),
		result1 = stats1.studentsTTestOneSample('iq', 75),
		result2 = stats1.studentsTTestOneSample(example2Values, 120),
		threshhold = stats1.epsilon;

	it("should compute the correct value for several examples", () => {
		assert.equal(Math.abs(result1.tStatistic + 0.783029) < threshhold, true);
		assert.equal(Math.abs(result1.pTwoSided - 0.4537205) < threshhold, true);
		assert.equal(result1.degreesOfFreedom, 9);

		assert.equal(Math.abs(result2.tStatistic - 4.51240365) < threshhold, true);
		assert.equal(Math.abs(result2.pTwoSided - 0.00023826) < threshhold, true);
		assert.equal(result2.degreesOfFreedom, 19);
	});

	it("should return undefined if only no or no existing column is given", () => {
		assert.equal(stats1.studentsTTestOneSample(), undefined);
		assert.equal(stats1.studentsTTestOneSample('abc'), undefined);
	});
});


/********************************
	Student's t-test two samples
 ********************************/

describe(".studentsTTestTwoSamplesstudentsTTestTwoSamples()", () => {
	//	https://de.wikipedia.org/wiki/Zweistichproben-t-Test#Zweistichproben-t-Test_f.C3.BCr_abh.C3.A4ngige_Stichproben
	let example1Values = [
			{ before: 223, after: 220 },
			{ before: 259, after: 244 },
			{ before: 248, after: 243 },
			{ before: 220, after: 211 },
			{ before: 287, after: 299 },
			{ before: 191, after: 170 },
			{ before: 229, after: 210 },
			{ before: 270, after: 276 },
			{ before: 245, after: 252 },
			{ before: 201, after: 189 },
		],
		example1Vars = { before: 'metric', after: 'metric' },
	// 	https://onlinecourses.science.psu.edu/stat500/node/50
		example2Values = [
			{ old: 42.1, new: 42.7 },
			{ old: 41.3, new: 43.8 },
			{ old: 42.4, new: 42.5 },
			{ old: 43.2, new: 43.1 },
			{ old: 41.8, new: 44.0 },
			{ old: 41.0, new: 43.6 },
			{ old: 41.8, new: 43.3 },
			{ old: 42.8, new: 43.5 },
			{ old: 42.3, new: 41.7 },
			{ old: 42.7, new: 44.1 },
		],
		example2Vars = { new: 'metric', old: 'metric' };

	let stats1 = new Statistics(example1Values, example1Vars, options),
		stats2 = new Statistics(example2Values, example2Vars, options),
		result1 = stats1.studentsTTestTwoSamples('before', 'after', { dependent: true }),
		result2 = stats2.studentsTTestTwoSamples('old', 'new', { dependent: false }),
		threshhold = stats1.epsilon;

	it("should compute the correct value for several examples", () => {
		assert.equal(Math.abs(result1.tStatistic - 1.6385377310) < threshhold, true);
		assert.equal(Math.abs(result1.pOneSided - 0.0678665579) < threshhold, true);
		assert.equal(result1.degreesOfFreedom, 9);

		assert.equal(Math.abs(result2.tStatistic + 3.3972307061) < threshhold, true);
		assert.equal(Math.abs(result2.pTwoSided - 0.0032111421) < threshhold, true);
		assert.equal(result2.degreesOfFreedom, 18);
	});

	it("should return undefined if only no or no existing column is given", () => {
		assert.equal(stats1.studentsTTestTwoSamples(), undefined);
		assert.equal(stats1.studentsTTestTwoSamples('abc'), undefined);
		assert.equal(stats1.studentsTTestTwoSamples('before'), undefined);
	});
});