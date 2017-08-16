Statistics.prototype.mean = function(data) { return (typeof data !== 'undefined') ? this.arithmeticMean(data) : undefined; }
Statistics.prototype.arithmeticMean = function(data) {
	if (typeof data === 'undefined') return this.errorMessage('Arithmetic mean: No data was supplied.');
	if (typeof data === 'string' && this.checkLastUpdated(data, 'mean') === false) return this.getStatistics(data, 'mean');
	let validated = this.validateInput(data, 'interval', 'arithmetic mean');
	if (validated === false) return;

	let mean = this.sumExact(validated.data) / validated.length;
	if (typeof data === 'string') this.updateStatistics(data, 'mean', mean);
	return mean;
}

Statistics.prototype.geometricMean = function(data) {
	if (typeof data === 'undefined') return this.errorMessage('Geometric mean: No data was supplied.');
	if (typeof data === 'string' && this.checkLastUpdated(data, 'geometricMean') === false) return this.getStatistics(data, 'geometricMean');
	let validated = this.validateInput(data, 'metric', 'geometric mean');
	if (validated === false) return;

	let mean = undefined,
		error = false;

	mean = validated.data.reduce((a, b) => {
		if (b > 0) {
			return a * b;
		} else {
			error = true;
			return a;
		}
	}, 1);

	if (!error && validated.length > 0) {
		mean = Math.pow(mean, 1 / validated.length);
	} else {
		this.errorMessage('Geometric mean is not defined because the data contains non-positive values.');
		mean = undefined;
	}

	if (typeof data === 'string') this.updateStatistics(data, 'geometricMean', mean);
	return mean;
}

Statistics.prototype.harmonicMean = function(data) {
	if (typeof data === 'undefined') return this.errorMessage('Harmonic mean: No data was supplied.');
	if (typeof data === 'string' && this.checkLastUpdated(data, 'harmonicMean') === false) return this.getStatistics(data, 'harmonicMean');
	let validated = this.validateInput(data, 'metric', 'harmonicMean');
	if (validated === false) return;

	let isNull = false,
		error = false,
		mean = validated.data.reduce((a, b) => {
			if (b < 0) { 
				error = true;
				return 0;
			} else if (b !== 0) {
				return a + 1 / b;
			} else {
				isNull = true;
				return 0;
			}
		}, 0);

	mean = (isNull) ? 0 : validated.length / mean;
	mean = (error) ? undefined : mean;

	if (typeof data === 'string') this.updateStatistics(data, 'harmonicMean', mean);
	return mean;
}

Statistics.prototype.rootMeanSquare = function(data) {
	if (typeof data === 'undefined') return this.errorMessage('Root mean square: No data was supplied.');
	if (typeof data === 'string' && this.checkLastUpdated(data, 'rootMeanSquare') === false) return this.getStatistics(data, 'rootMeanSquare');
	let validated = this.validateInput(data, 'interval', 'root mean square');
	if (validated === false) return;

	let mean = Math.sqrt(validated.data.reduce((a, b) => { return a + b * b; }, 0) / validated.length);

	if (typeof data === 'string') this.updateStatistics(data, 'rootMeanSquare', mean);
	return mean;
}

Statistics.prototype.cubicMean = function(data) {
	if (typeof data === 'undefined') return this.errorMessage('Cubic mean: No data was supplied.');
	if (typeof data === 'string' && this.checkLastUpdated(data, 'cubicMean') === false) return this.getStatistics(data, 'cubicMean');
	let validated = this.validateInput(data, 'interval', 'cubic mean');
	if (validated === false) return;

	let mean = validated.data.reduce((a, b) => { return a + b * b * b; }, 0);
	mean = (mean >= 0 && validated.length > 0) ? Math.pow(mean / validated.length, 1/3) : undefined; 

	if (typeof data === 'string') this.updateStatistics(data, 'cubicMean', mean);
	return mean;
}


/**
	Winsorised (truncated) mean to discard outliers. Specify a percentage in the range [0, 0.5]
	of values to be cut off of either end of the distribution.
**/

Statistics.prototype.winsorisedMean = function(data, percentage = 0.2) {
	if (typeof data === 'undefined') return this.errorMessage('Winsorised mean: No data was supplied.');
	if (percentage < 0 || percentage > 0.5) return this.errorMessage('winsorisedMean should be called with a percentage value within the range of [0, 0.5].');
	if (percentage === 0.5) return this.median(data);

	let validated = this.validateInput(data, 'interval', 'Winsorised (truncated) mean');
	if (validated === false) return;

	let cutoff = Math.floor(validated.length * percentage),
		values = this.sort(validated.data).slice(cutoff, validated.length - cutoff);

	values = Array(cutoff).fill(values[0]).concat(values).concat(Array(cutoff).fill(values[values.length - 1]));
	let	mean = this.sumExact(values) / (validated.length);

	return mean;
}


/**
	Gastwirth-Cohen Mean is defined as the weighted mean of three quantils:
	the lambda-weighted (alpha)quantil and (1 - alpha)quantil and
	the (1 - 2*lambda)-weighted median
	alpha and lambda must be within the range of [0, 0.5]
**/

Statistics.prototype.gastwirthCohenMean = function(data, { alpha: alpha = 0.25, lambda: lambda = 0.25 } = {}) {
	if (typeof data === 'undefined') return this.errorMessage('Gastwirth-Cohen mean: No data was supplied.');
	let validated = this.validateInput(data, 'ordinal', 'Gastwirth-Cohen Mean');
	if (validated === false) return;

	if (!this.isNumeric(alpha) || alpha < 0 || alpha > 0.5) return this.errorMessage('Gastwirth-Cohen mean should be called with an alpha value within the range of [0, 0.5].');
	if (!this.isNumeric(lambda) || lambda < 0 || lambda > 0.5) return this.errorMessage('Gastwirth-Cohen mean should be called with a lambda value within the range of [0, 0.5].');

	let lowerQuantil = this.quantile(data, alpha),
		higherQuantil = this.quantile(data, 1 - alpha),
		median = this.median(data),
		mean = undefined;

	if (typeof lowerQuantil !== 'undefined' && typeof higherQuantil !== 'undefined' && typeof median !== 'undefined')
		mean = lambda * (lowerQuantil + higherQuantil) + (1 - 2 * lambda) * median;
	return mean;
}



Statistics.prototype.midRange = function(data) {
	if (typeof data === 'undefined') return this.errorMessage('Mid-range: No data was supplied.');
	let validated = this.validateInput(data, 'interval', 'mid-range');
	if (validated === false) return;

	let min = this.minimum(data),
		max = this.maximum(data);
	return  (typeof min !== 'undefined' && typeof max !== 'undefined') ? 0.5 * (min + max) : undefined;
}


Statistics.prototype.median = function(data) {
	if (typeof data === 'undefined') return this.errorMessage('Median: No data was supplied.');
	if (typeof data === 'string' && this.checkLastUpdated(data, 'median') === false) return this.getStatistics(data, 'median');

	let median = this.quantile(data, 0.5);
	if (typeof data === 'string') this.updateStatistics(data, 'median', median);
	return median;
}


/**
	returns the most frequent value within a dataset
**/

Statistics.prototype.mode = function(data) {
	if (typeof data === 'undefined') return this.errorMessage('Mode: No data was supplied.');
	if (typeof data === 'string' && this.checkLastUpdated(data, 'mode') === false) return this.getStatistics(data, 'mode');
	let validated = this.validateInput(data, 'nominal', 'mode');
	if (validated === false) return;

	let values = validated.data,
		valueList = [],
		maxValues = [values[0]],
		maxCount = 1;

	for (var i = 1; i < validated.length; i++) {
		let value = values[i];
		valueList[value] = (valueList[value] == null) ? 1 : valueList[value] + 1;

		if (valueList[value] > maxCount) {
			maxValues = [value];
			maxCount = valueList[value];
		} else if (valueList[value] === maxCount) {
			maxValues.push(value);
		}
	}

	if (maxValues.length === 1) maxValues = maxValues[0];
	if (typeof data === 'string') this.updateStatistics(data, 'mode', maxValues);
	return maxValues;
}