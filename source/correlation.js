/********* Covariance *********/

Statistics.prototype.covariance = function(firstColumn, secondColumn, corrected = true) {
	if (typeof secondColumn === 'undefined') return this.errorMessage('Covariance requires two variables to be compared.');

	let validatedFirst = this.validateInput(firstColumn, 'interval', 'covariance');
	if (validatedFirst === false) return;
	let validatedSecond = this.validateInput(secondColumn, 'interval', 'covariance');
	if (validatedSecond === false) return;

	let reduced = this.reduceToPairs(validatedFirst.data, validatedSecond.data);
	if (reduced.length === 0) return;

	let	meanFirst = this.mean(reduced.valuesFirst),
		meanSecond = this.mean(reduced.valuesSecond),
		covariance = 0;

	for (var i = 0; i < reduced.length; i++) {
		covariance += (reduced.valuesFirst[i] - meanFirst) * (reduced.valuesSecond[i] - meanSecond);
	}

	if (corrected && reduced.length > 1) covariance /= reduced.length - 1;
	else if (!corrected && reduced.length > 0) covariance /= reduced.length;
	else covariance = undefined;

	return { covariance, missings: reduced.missings };
}



/********* Pearson's correlation coefficient *********/

Statistics.prototype.correlationCoefficient = function(firstColumn, secondColumn) {
	if (typeof secondColumn === 'undefined') return this.errorMessage('Pearson correlation coefficient requires two variables to be compared.');

	let validatedFirst = this.validateInput(firstColumn, 'interval', 'Pearson correlation coefficient');
	if (validatedFirst === false) return;
	let validatedSecond = this.validateInput(secondColumn, 'interval', 'Pearson correlation coefficient');
	if (validatedSecond === false) return;


	let len = (validatedFirst.length >= validatedSecond.length) ? validatedFirst.length : validatedSecond.length,
		valuesFirst = validatedFirst.data,
		valuesSecond = validatedSecond.data,
		values = [],
		meanFirst = 0,
		meanSecond = 0;

	// Don't use overall means and variances to account for missing data, only use paired values

	for (var i = 0; i < len; i++) {
		let valF = valuesFirst[i],
			valS = valuesSecond[i];

		if (typeof valF !== undefined && typeof valS !== undefined && !isNaN(valF) && !isNaN(valS)) {
			meanFirst += valF;
			meanSecond += valS;
			values.push([valF, valS]);
		}
	}

	let missings = len - values.length;
	len = values.length;
	if (len === 0) return;

	meanFirst /= len;
	meanSecond /= len;

	let divisor = 0,
		varianceFirst = 0,
		varianceSecond = 0;

	for (var i = 0; i < len; i++) {
		let first = values[i][0] - meanFirst,
			second = values[i][1] - meanSecond;

		divisor += first * second;
		varianceFirst += first * first;
		varianceSecond += second * second;
	}

	let correlationCoefficient = (varianceFirst > 0 && varianceSecond > 0) ? divisor / Math.sqrt(varianceFirst * varianceSecond) : 0;
	return { correlationCoefficient, missings };
}




/********* Spearman's Rho *********/

Statistics.prototype.spearmansRho = function(firstColumn, secondColumn, adjustForTies = false) {
	if (typeof secondColumn === 'undefined') return this.errorMessage("Spearman's Rho requires two variables to be compared.");

	let validatedFirst = this.validateInput(firstColumn, 'ordinal', 'Spearman\'s Rho');
	if (validatedFirst === false) return;
	let validatedSecond = this.validateInput(secondColumn, 'ordinal', 'Spearman\'s Rho');
	if (validatedSecond === false) return;

	let reduced = this.reduceToPairs(firstColumn, secondColumn),
		length = reduced.length;

	if (length === 0) return;

	let data = this.assignRanks(firstColumn, { data: reduced.valuesCombined, returnFrequencies: true, order: 'desc' }),
		ranksFirst = data.frequencies;
	data = this.assignRanks(secondColumn, { data: data.data, returnFrequencies: true, order: 'desc' });
	let ranksSecond = data.frequencies;
	data = data.data;

	let distances = data.reduce((acc, val) => {
		return acc + Math.pow(val['rank-' + firstColumn] - val['rank-' + secondColumn], 2);
	}, 0);


	let rho = 6 * distances;

	if (adjustForTies) {
		let Tx = Object.values(ranksFirst).reduce((acc, val) => { return acc + Math.pow(val, 3) - val; }),
			Ty = Object.values(ranksSecond).reduce((acc, val) => { return acc + Math.pow(val, 3) - val; }),
			numerator = (Math.pow(length, 3) - length - 0.5 * Tx - 0.5 * Ty - rho),
			denominator = Math.sqrt((Math.pow(length, 3) - length - Tx) * (Math.pow(length, 3) - length - Ty));
		rho = numerator / denominator;
	} else {
		rho = 1 - (rho / (Math.pow(length, 3) - length));
	}

	let df = length - 2,
		z = Math.sqrt((df - 1) / 1.06) * this.fisherTransformation(rho),
		pNormal = 1 - this.normalCumulativeValue(Math.abs(z)),
		t = rho * Math.sqrt(df / (1 - rho * rho)),
		pStudent = 1 - this.studentsTCumulativeValue(Math.abs(t), df);

	return {
		rho,
		significanceNormal: {
			zScore: z,
			pOneTailed: pNormal,
			pTwoTailed: 2 * pNormal
		},
		significanceStudent: {
			degreesOfFreedom: df,
			tStatistic: t,
			pOneTailed: pStudent,
			pTwoTailed: 2 * pStudent
		},
		missings: reduced.missings	
	};
}


/********* Kendall's Tau *********/

Statistics.prototype.kendallsTau = function(firstColumn, secondColumn) {
	if (typeof secondColumn === 'undefined') return this.errorMessage('Kendall\'s Tau requires two columns to analyze.');

	let validatedFirst = this.validateInput(firstColumn, 'ordinal', 'Kendall\'s Tau');
	if (validatedFirst === false) return;
	let validatedSecond = this.validateInput(secondColumn, 'ordinal', 'Kendall\'s Tau');
	if (validatedSecond === false) return;

	let reduced = this.reduceToPairs(firstColumn, secondColumn),
		length = reduced.length,
		values = reduced.valuesCombined;

	let concordants = 0,
		discordants = 0,
		tiesFirst = {},
		tiesSecond = {},
		tiesBoth = 0;

	for (var i = 0; i < length - 1; i++) {
		for (var j = i + 1; j < length; j++) {
			let valF1 = values[i][firstColumn],
				valF2 = values[j][firstColumn],
				valS1 = values[i][secondColumn],
				valS2 = values[j][secondColumn];

			if (valF1 === valF2) {
				if (valS1 === valS2)
					tiesBoth += 1;
				else tiesFirst[valS1] = (this.has(tiesFirst, valS1)) ? tiesFirst[valS1] + 1 : 1;
			} else if (valS1 === valS2) {
				tiesSecond[valS1] = (this.has(tiesSecond, valS1)) ? tiesSecond[valS1] + 1 : 1;
			} else if (Math.sign(valF1 - valF2) === Math.sign(valS1 - valS2)) {
				concordants += 1;
			} else {
				discordants += 1;
			}
		}
	}

	let diff = concordants - discordants,
		tauA = (Object.keys(tiesFirst).length + Object.keys(tiesSecond).length === 0) ? 2 * diff / (length * (length - 1)) : undefined,
		zA = 3 * diff / Math.sqrt(0.5 * length * (length - 1) * (2 * length + 5)),
		pzA = this.normalCumulativeValue(- Math.abs(zA)),
		m = (2 < reduced.length) ? 2 : reduced.length,
		tauC = 2 * m * diff / (length * length * (m - 1));

	let tauB = tauA,
		zB = zA,
		pzB = pzA;

	// tau b and its statistics are identical to tau a if no ties are present
	if (typeof tauA === 'undefined') {
		tauB = diff / Math.sqrt((concordants + discordants + Object.keys(tiesFirst).length) * (concordants + discordants + Object.keys(tiesSecond).length));

		let vt = 0,
			vu = 0,
			v11 = 0,
			v12 = 0,
			v21 = 0,
			v22 = 0;

		for (var ties in tiesFirst) {
			vt += ties * (ties - 1) * (2 * ties + 5);
			v11 += ties * (ties - 1);
			v12 += ties * (ties - 1) * (ties - 2);
		}

		for (var ties in tiesSecond) {
			vu += ties * (ties - 1) * (2 * ties + 5);
			v12 += ties * (ties - 1) / (2 * length * (length - 1));
			v22 += ties * (ties - 1) * (ties - 2) / (9 * length * (length - 1) * (length - 2));
		}

		zB = length * (length - 1) * (2 * length + 5);	// v0
		zB = (zB - vt - vu)/18 + v11 * v12 + v21 * v22,		// v
		zB = diff / Math.sqrt(zB);							// zB
		pzB = this.normalCumulativeValue(- Math.abs(zB));
	}


	let a = (typeof tauA !== 'undefined') ? { tauA, z: zA, pOneTailed: pzA, pTwoTailed: 2 * pzA } : undefined,
		b = (typeof tauA !== 'undefined') ? { tauB: tauA, z: zA, pOneTailed: pzA, pTwoTailed: 2 * pzA } : { tauB, z: zB, pOneTailed: pzB, pTwoTailed: 2 * pzB };

	return { a, b, c: { tauC: tauC }, missings: reduced.missings }
}



/********* Goodman and Kruskal's Gamma *********/

Statistics.prototype.goodmanKruskalsGamma = function(firstColumn, secondColumn) {
	if (typeof secondColumn === 'undefined') return this.errorMessage('Goodman and Kruskal\'s Gamma requires two columns to analyze.');

	let validatedFirst = this.validateInput(firstColumn, 'ordinal', 'Goodman and Kruskal\'s Gamma');
	if (validatedFirst === false) return;
	let validatedSecond = this.validateInput(secondColumn, 'ordinal', 'Goodman and Kruskal\'s Gamma');
	if (validatedSecond === false) return;

	let reduced = this.reduceToPairs(firstColumn, secondColumn),
		values = reduced.valuesCombined,
		length = reduced.length,
		concordants = 0,
		discordants = 0;

	for (var i = 0; i < length - 1; i++) {
		for (var j = i + 1; j < length; j++) {
			let valF1 = values[i][firstColumn],
				valF2 = values[j][firstColumn],
				valS1 = values[i][secondColumn],
				valS2 = values[j][secondColumn];

			if (valF1 === valF2 || valS1 === valS2)
				continue;

			if (Math.sign(valF1 - valF2) === Math.sign(valS1 - valS2)) {
				concordants += 1;
			} else {
				discordants += 1;
			}
		}
	}

	let gamma = (concordants - discordants) / (concordants + discordants),
		t = gamma * Math.sqrt((concordants + discordants) / (length * (1 - gamma * gamma))),
		p = 1 - this.studentsTCumulativeValue(Math.abs(t), length - 2);

	return { gamma, tStatistic: t, pOneTailed: p, pTwoTailed: 2 * p, missings: reduced.missings };
}


Statistics.prototype.fisherTransformation = function(coeff) {
	if (typeof coeff === 'undefined' || !this.isNumeric(coeff) || coeff < -1 || coeff > 1) return this.errorMessage('Fisher transformation is only defined for a Pearson correlation coefficient within the interval of [-1, 1].');

	return Math.atanh(coeff) || 0.5 * Math.log((1 + coeff) / (1 - coeff));
}


