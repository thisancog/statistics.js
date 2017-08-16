Statistics.prototype.skewness = function(data, populationSkewness = false) {
	if (typeof data === 'undefined') return this.errorMessage('Skewness: No data was supplied.');
	if (typeof data === 'string' && this.checkLastUpdated(data, 'skewness') === false) return this.getStatistics(data, 'skewness');
	let validated = this.validateInput(data, 'ordinal', 'skewness');
	if (validated === false) return;
	if (validated.length < 2) return;

	let mean = this.mean(data),
		deviation = this.standardDeviation(data, false),
		sum = 0;

	for (var i = 0; i < validated.length; i++) {
		sum += Math.pow(validated.data[i] - mean, 3);
	}

	let skewness = sum / Math.pow(deviation, 3);
	skewness *= populationSkewness ? (validated.length / ((validated.length - 1) * (validated.length - 2))) : (1 / validated.length);

	if (typeof data === 'string') this.updateStatistics(data, 'skewness', skewness);
	return skewness;
}


Statistics.prototype.kurtosis = function(data) {
	if (typeof data === 'undefined') return this.errorMessage('Kurtosis: No data was supplied.');
	if (typeof data === 'string' && this.checkLastUpdated(data, 'kurtosis') === false) return this.getStatistics(data, 'kurtosis');
	let validated = this.validateInput(data, 'ordinal', 'kurtosis');
	if (validated === false) return;
	if (validated.length < 2) return;

	let mean = this.mean(data),
		deviation = this.standardDeviation(data),
		sum = 0;
			
	for (var i = 0; i < validated.length; i++) {
		sum += Math.pow(validated.data[i] - mean, 4);
	}

	let kurtosis = sum / (validated.length * Math.pow(deviation, 4));

	if (typeof data === 'string') this.updateStatistics(data, 'kurtosis', kurtosis);
	return kurtosis;
}

Statistics.prototype.excessKurtosis = function(data) {
	if (typeof data === 'undefined') return this.errorMessage('Excess kurtosis: No data was supplied.');
	let kurtosis = this.kurtosis(data);
	return (typeof kurtosis !== 'undefined') ? kurtosis - 3 : undefined;
}