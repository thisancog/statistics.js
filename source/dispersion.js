Statistics.prototype.minimum = function(data) {
	if (typeof data === 'undefined') return this.errorMessage('Minimum: No data was supplied.');
	if (typeof data === 'string' && this.checkLastUpdated(data, 'minimum') === false) return this.getStatistics(data, 'minimum');
	let validated = this.validateInput(data, 'ordinal', 'minimum');
	if (validated === false) return;

	let minimum = Infinity,
		len = validated.length;

	while (len--) {
		if (validated.data[len] < minimum) minimum = validated.data[len];
	}

	if (typeof data === 'string') this.updateStatistics(data, 'minimum', minimum);
	return minimum;
}

Statistics.prototype.maximum = function(data) {
	if (typeof data === 'undefined') return this.errorMessage('Maximum: No data was supplied.');
	if (typeof data === 'string' && this.checkLastUpdated(data, 'maximum') === false) return this.getStatistics(data, 'maximum');
	let validated = this.validateInput(data, 'ordinal', 'maximum');
	if (validated === false) return;

	let maximum = -Infinity,
		len = validated.length;

	while (len--) {
		if (validated.data[len] > maximum) maximum = validated.data[len];
	}

	if (typeof data === 'string') this.updateStatistics(data, 'maximum', maximum);
	return maximum;
}

Statistics.prototype.range = function(data) {
	if (typeof data === 'undefined') return this.errorMessage('Range: No data was supplied.');
	if (typeof data === 'string' && this.checkLastUpdated(data, 'range') === false) return this.getStatistics(data, 'range');

	let validated, range;

	if (typeof data === 'string' && this.getScale(data) === 'nominal') {
		validated = this.validateInput(data, 'nominal', 'range');
		if (validated === false) return;

		range = this.getUniqueValues(validated.data);
	} else {
		validated = this.validateInput(data, 'ordinal', 'range');
		if (validated === false) return;

		let values = this.sort(validated.data);
		range = values[validated.length - 1] - values[0];
	}

	if (typeof data === 'string') this.updateStatistics(data, 'range', range);
	return range;
}

/**
	Calculate variance of a set of data values.
	If dataset is only a sample of a larger population,
	Bessel correction should be applied by setting corrected to true.
	This will make use of Welford's algorithm to calculate exact sample variance.
	Otherwise, pass an integer or float as the true mean of the population.
**/

Statistics.prototype.variance = function(data, corrected = true) {
	if (typeof data === 'undefined') return this.errorMessage('Variance: No data was supplied.');
	if (typeof data === 'string' && this.checkLastUpdated(data, 'variance') === false) return this.getStatistics(data, 'variance');
	let validated = this.validateInput(data, 'interval', 'variance');
	if (validated === false) return;
	if (validated.length < 2) return this.errorMessage('The data supplied to compute variance needs to contain at least two datasets.');

	let variance = 0;

	if (this.isNumeric(corrected)) {
		for (var i = 0; i < validated.length; i++) {
			variance += Math.pow(corrected - validated.data[i], 2);
		}
		variance /= (validated.length - 1);
	} else {
		let n = 0,
			mean = 0;

		for (var i = 0; i < validated.length; i++) {
			n += 1;
			let delta = validated.data[i] - mean;
			mean += delta / n;
			let delta2 = validated.data[i] - mean;
			variance += delta * delta2;
		}

		if (corrected && n > 1) variance /= n - 1;
		else if (!corrected && n > 0) variance /= n;
		else variance = undefined
	}

	if (typeof data === 'string') this.updateStatistics(data, 'variance', variance);
	return variance;
}


/**
	Calculate standard deviation of a set of data values.
	If dataset is only a sample of a larger population,
	Bessel correction should be applied by setting corrected to true.
**/

Statistics.prototype.standardDeviation = function(data, corrected = true) {
	if (typeof data === 'undefined') return this.errorMessage('Standard deviation: No data was supplied.');
	if (typeof data === 'string' && this.checkLastUpdated(data, 'standardDeviation') === false) return this.getStatistics(data, 'standardDeviation');
	let validated = this.validateInput(data, 'interval', 'standard deviation');
	if (validated === false) return;
	if (validated.length < 2) return this.errorMessage('The data supplied to compute standardDeviation needs to contain at least two datasets.');

	let deviation = Math.sqrt(this.variance(data, corrected));

	if (typeof data === 'string') this.updateStatistics(data, 'standardDeviation', deviation);
	return deviation;
}

/**
	The coefficient of variation is a relative parameter of dispersion that expresses the
	standard deviation relative to the expected value of a statistical variable. This allows for comparison
	of variables with significantly diverse expected values.
	The expected value can either be supplied as an additional input parameter or will be substituted
	by the arithmetic mean.
**/

Statistics.prototype.coefficientOfVariation = function(data, expectedValue) {
	if (typeof data === 'undefined') return this.errorMessage('Coefficient of variation: No data was supplied.');
	let validated = this.validateInput(data, 'interval', 'coefficient of variation');
	if (validated === false) return;

	let standardDeviation = this.standardDeviation(validated.data),
		mean = (typeof expectedValue === 'undefined') ? this.mean(validated.data) : expectedValue;
	return (typeof standardDeviation !== 'undefined' && typeof mean !== 'undefined' && mean !== 0) ? standardDeviation / mean : undefined;
}


Statistics.prototype.indexOfDispersion = function(data, expectedValue) {
	if (typeof data === 'undefined') return this.errorMessage('Index of dispersion: No data was supplied.');
	let validated = this.validateInput(data, 'interval', 'coefficient of variation');
	if (validated === false) return;

	let variance = this.variance(validated.data),
		mean = (typeof expectedValue === 'undefined') ? this.mean(validated.data) : expectedValue;
	return (typeof variance !== 'undefined' && typeof mean !== 'undefined' && mean !== 0) ? variance / mean : undefined;
}


Statistics.prototype.geometricStandardDeviation = function(data) {
	if (typeof data === 'undefined') return this.errorMessage('Geomtric standard deviation: No data was supplied.');
	if (typeof data === 'string' && this.checkLastUpdated(data, 'geometricStandardDeviation') === false) return this.getStatistics(data, 'geometricStandardDeviation');
	let validated = this.validateInput(data, 'interval', 'geometric standard deviation');
	if (validated === false) return;

	let len = validated.length,
		mean = this.geometricMean(data),
		deviation = 0,
		error = false;

	for (var i = 0; i < len; i++) {
		if (validated.data[i] <= 0) error = true;
		else deviation += Math.pow(Math.log(validated.data[i] / mean), 2);
	}

	deviation = (error) ? undefined : Math.exp(Math.sqrt(deviation / len));

	if (typeof data === 'string') this.updateStatistics(data, 'geometricStandardDeviation', deviation);
	return deviation;
}

Statistics.prototype.medianAbsoluteDeviation = function(data) {
	if (typeof data === 'undefined') return this.errorMessage('Median absolute deviation: No data was supplied.');
	let validated = this.validateInput(data, 'interval', 'median absolute deviation');
	if (validated === false) return;

	let values = validated.data,
		median = this.median(values);
	if (typeof median === 'undefined') return;

	values = values.map(a => {
		return Math.abs(a - median);
	});

	return this.median(values);
}

Statistics.prototype.cumulativeFrequency = function(data, boundary) {
	if (typeof data === 'undefined') return this.errorMessage('Cumulative frequency: No data was supplied.');
	if (typeof boundary === 'undefined' || !this.isNumeric(boundary)) {
		this.errorMessage('You need to specify a boundary for the cumulative frequency analysis that is either an integer or a floating point number.');
		return;
	}

	let validated = this.validateInput(data, 'ordinal', 'cumulative frequency analysis');
	if (validated === false) return;

	let values = this.sort(validated.data),
		frequency = 0;

	while (boundary >= values[frequency]) { frequency++; }
	return frequency;
}

Statistics.prototype.frequencies = function(data) {
	if (typeof data === 'undefined') return this.errorMessage('Frequencies: No data was supplied.');
	let validated = this.validateInput(data, 'nominal', 'frequencies');
	if (validated === false) return;

	let values = validated.data,
		valueList = {},
		uniques = [];

	for (var i = 0; i < validated.length; i++) {
		let value = values[i];
		if (valueList[value] == null) {
			uniques.push(value);
			valueList[value] = 1;
		} else {
			valueList[value]++;
		}
	}

	uniques = uniques.sort((a, b) => {
		return valueList[b] - valueList[a];
	});

	uniques = uniques.map(item => {
		return { value: item, absolute: valueList[item], relative: valueList[item] / validated.length };
	});

	return uniques;
};

// percentage should be in range [0, 1]
Statistics.prototype.quantile = function(data, percentage = 0.5) {
	if (typeof data === 'undefined') return this.errorMessage('Quantile: No data was supplied.');
	if (!this.isNumeric(percentage) || percentage < 0 || percentage > 1) return this.errorMessage('Quantiles should be called with a percentage value within the range of [0, 1].');

	let validated = this.validateInput(data, 'ordinal', 'quantile');
	if (validated === false) return;

	let num = percentage * validated.length,
		values = this.sort(validated.data);

	return (num % 1 === 0) ? 0.5 * (values[num] + values[num - 1]) : values[Math.floor(num)];
}


Statistics.prototype.quartiles = function(data) {
	if (typeof data === 'undefined') return this.errorMessage('Quartiles: No data was supplied.');
	if (typeof data === 'string' && this.checkLastUpdated(data, 'quartiles') === false) return this.getStatistics(data, 'quartiles');

	let quartiles = [this.quantile(data, 0.25), this.quantile(data, 0.75)];
	if (typeof quartiles[0] !== 'undefined' && typeof quartiles[1] !== 'undefined') {
		this.updateStatistics(data, 'quartiles', quartiles);
		return quartiles;
	} else {
		return;
	}
}


Statistics.prototype.interQuartileRange = function(data) {
	if (typeof data === 'undefined') return this.errorMessage('Interquartile range: No data was supplied.');
	let validated = this.validateInput(data, 'interval', 'interquartile range');
	if (validated === false) return;

	let quartiles = this.quartiles(validated.data);
	return (typeof quartiles !== 'undefined') ? quartiles[1] - quartiles[0] : undefined;
}