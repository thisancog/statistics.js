/********* Student's t-test *********/

Statistics.prototype.studentsTTestOneSample = function(column, nullHypothesisMean) {
	if (typeof nullHypothesisMean === 'undefined' || !this.isNumeric(nullHypothesisMean)) return this.errorMessage("Student's t-test (one sample) requires data and the mean for which the null hypothesis should hold true.");

	let validated = this.validateInput(column, 'interval', "student's t-test (one sample)");
	if (validated === false) return;
	if (validated.length === 0) return;

	let mean = this.mean(validated.data),
		stdiffDev = this.standardDeviation(validated.data);

	let	t = Math.sqrt(validated.length) * (mean - nullHypothesisMean) / stdiffDev,
		df = validated.length - 1,
		p = this.studentsTCumulativeValue(Math.abs(t), df);

	if (p > 0.5) p = 1 - p;

	return { tStatistic: t, degreesOfFreedom: df, pOneSided: p, pTwoSided: 2 * p };
}


Statistics.prototype.studentsTTestTwoSamples = function(firstColumn, secondColumn,
	{ nullHypothesisDifference: nullHypothesisDifference = 0,
	  dependent: dependent = false
	} = {}) {
	if (typeof secondColumn === 'undefined') return this.errorMessage("Student's t-test (two sample) requires data for two columns and the difference of their means for which the null hypothesis should hold true.");

	let validatedFirst = this.validateInput(firstColumn, 'interval', "student's t-test (two sample)"),
		validatedSecond = this.validateInput(secondColumn, 'interval', "student's t-test (two sample)");
	if (validatedFirst === false || validatedSecond === false) return;

	let n = validatedFirst.length,
		m = validatedSecond.length,
		result = {},
		t, df;

	if (n === 0 || m === 0) return;

	if (dependent) {
		let reduced = this.reduceToPairs(validatedFirst.data, validatedSecond.data),
			valuesFirst = reduced.valuesFirst,
			valuesSecond = reduced.valuesSecond;

		let diffDev = 0,
			diffMean = 0;

		// calculate mean difference of first and second column's values
		for (var i = 0; i < reduced.length; i++) {
			diffMean += valuesFirst[i] - valuesSecond[i];
		}

		diffMean /= reduced.length;

		// calculate standard deviation of differences of first and second column's values
		for (var i = 0; i < reduced.length; i++) {
			diffDev += Math.pow(valuesFirst[i] - valuesSecond[i] - diffMean, 2);
		}

		diffDev = Math.sqrt(diffDev / (reduced.length - 1));

		t = Math.sqrt(n) * (diffMean - nullHypothesisDifference) / diffDev;
		df = reduced.length - 1;
		result = { tStatistic: t, degreesOfFreedom: df, missings: reduced.missings };

	} else {
		let meanFirst = this.mean(validatedFirst.data),
			meanSecond = this.mean(validatedSecond.data),
			varianceFirst = this.variance(validatedFirst.data),
			varianceSecond = this.variance(validatedSecond.data),
			weightedVariance = Math.sqrt(((n - 1) * varianceFirst + (m - 1) * varianceSecond) / (n + m - 2));

		t = (meanFirst - meanSecond - nullHypothesisDifference) / weightedVariance;
		t *= Math.sqrt(n * m / (n + m));
		df = n + m - 2;

		result = { tStatistic: t, degreesOfFreedom: df };
	}

	let p = this.studentsTCumulativeValue(t, df);
	if (p > 0.5) p = 1 - p;

	result.pOneSided = p;
	result.pTwoSided = 2 * p;
	return result;
}

