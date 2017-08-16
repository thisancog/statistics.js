/********* Linear regression *********/

Statistics.prototype.linearRegression = function(firstColumn, secondColumn) {
	if (typeof secondColumn === 'undefined') return this.errorMessage('Linear regression requires two columns to compare.');
	let validatedFirst = this.validateInput(firstColumn, 'interval', 'linear regression');
	if (validatedFirst === false) return;
	let validatedSecond = this.validateInput(secondColumn, 'interval', 'linear regression');
	if (validatedSecond === false) return;

	let reduced = this.reduceToPairs(validatedFirst.data, validatedSecond.data),
		valuesFirst = reduced.valuesFirst,
		valuesSecond = reduced.valuesSecond,
		missings = reduced.missings,
		length = reduced.length;

	if (length === 0) return;

	let meanFirst = this.mean(valuesFirst),
		meanSecond = this.mean(valuesSecond),
		varianceFirst = 0,	// don't use this.variance to save time since this will calculate arithmetic means again
		varianceSecond = 0,
		factor = 0;

	for (var i = 0; i < length; i++) {
		let diffF = valuesFirst[i] - meanFirst,
			diffS = valuesSecond[i] - meanSecond;

		factor += diffF * diffS;
		varianceFirst += diffF * diffF;
		varianceSecond += diffS * diffS;
	}

	if (varianceFirst === 0 || varianceSecond === 0) return;

	let beta2First = factor / varianceFirst,
		beta2Second = factor / varianceSecond,
		beta1First = meanSecond - beta2First * meanFirst,
		beta1Second = meanFirst - beta2Second * meanSecond;

	let corrCoeff = factor / Math.sqrt(varianceFirst * varianceSecond),
		coeffDeterm = corrCoeff * corrCoeff,
		coeffDetermCorrected = (length > 2) ? 1 - (1 - coeffDeterm) * (length - 1) / (length - 2) : undefined,
		phi = Math.acos(corrCoeff) * 180 / Math.PI;

	if (phi > 90) phi = 180 - phi;

	return {
		regressionFirst: {
			beta1: beta1First,
			beta2: beta2First
		},
		regressionSecond: {
			beta1: beta1Second,
			beta2: beta2Second
		},
		coefficientOfDetermination: coeffDeterm,
		coefficientOfDeterminationCorrected: coeffDetermCorrected,
		correlationCoefficient: corrCoeff,
		phi: phi
	};
}