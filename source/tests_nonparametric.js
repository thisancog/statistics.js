/********* Barnard's exact test *********/

Statistics.prototype.barnardsTest = function(firstColumn, secondColumn) {
	if (typeof secondColumn === 'undefined') return this.errorMessage('Barnard\'s test: No data was supplied.');
	let validated = this.contingencyTable(firstColumn, secondColumn, 'Barnard\'s test');
	if (typeof validated === 'undefined') return;

	let { a, b, c, d } = validated,
		total = a + b + c + d;

	if (total > this.maxBarnardsN) return this.errorMessage('Barnard\'s test is a resource-intensive method, relative to the total number of datasets to analyze. There are ' + total + ' datasets in the supplied data, exceeding the maxinum of ' + this.maxBarnardsN + '. You can change this number by changing the "maxBarnardsN" option (be cautious).');

	var waldBase = (a + b) / total;
	waldBase = waldBase * (1 - waldBase) * (1 / (a + c) + 1 / (b + d));
	waldBase = (b / (b + d) - a / (a + c)) / Math.sqrt(waldBase);

	if (isNaN(waldBase)) waldBase = 0;

	let results = [];

	for (var step = 0; step < 1; step = this.sumExact([step, 0.001])) {

		let probabilitySum = 0;

		for (var i = 0; i <= a + c; i++) {
			for (var j = 0; j <= b + d; j++) {
				let newWald = (i + j) / total;
				newWald = newWald * (1 - newWald) * ((1 / (a + c)) + (1 / (b + d)));
				newWald = (i / (a + c) - j / (b + d)) / Math.sqrt(newWald);

				if (!isNaN(newWald) && Math.abs(newWald) >= Math.abs(waldBase)) {
					let probability = this.binomialCoefficient(a + c, i) * this.binomialCoefficient(b + d, j);
					probability *= Math.pow(step, i + j) * Math.pow(1 - step, total - i - j);

					probabilitySum += isNaN(probability) ? 0 : probability;
				}
			}
		}

		results.push({ nuisance: step, significance: probabilitySum });
	}

	results = this.sortDataByColumn('significance', { data: results, order: 'desc' });

	return {
		wald: waldBase,
		nuisance: results[0].nuisance,
		pOneTailed: 0.5 * results[0].significance,
		pTwoTailed: results[0].significance
	};
}




/********* Binomial test *********/

Statistics.prototype.binomialTest = function(data, valueToTest, alpha = 0.5) {
	if (typeof valueToTest === 'undefined') return this.errorMessage('Binomial test requires the data to test and a value which is hypotethised to be observed with a probability of alpha.');
	if (alpha < 0 || alpha > 1) return this.errorMessage('Binomial test is only defined for probabilities alpha with alpha ≥ 0 and alpha ≦ 1.');

	let scale = this.getScale(data);
	if (scale === 'interval' || scale === 'metric') return this.errorMessage('Binomial test is only defined for data of nominal or ordinal dichotomic scale.');

	let validated = this.validateInput(data, 'nominal', 'binomial test');
	if (validated === false) return;

	let uniques = this.getUniqueValues(validated.data);
	if (uniques.length > 2) return this.errorMessage('Binomial test is only defined for dichotomic data. The supplied data has ' + uniques.length + ' unique values.');
	if (uniques.length === 2 && uniques.indexOf(valueToTest) < 0) return this.errorMessage('The value "' + valueToTest + '" was not found in the supplied data.');

	let k = validated.data.filter(function(item) {
			return item === valueToTest;
		}).length;

	let	exactly = this.binomialProbabilityMass(k, validated.length, alpha),
		fewer = this.binomialCumulativeValue(k - 1, validated.length, alpha),
		more = 1 - fewer - exactly;

	return {
		pExactly: exactly,
		pFewer: fewer,
		pAtMost: fewer + exactly,
		pMore: more,
		pAtLeast: more + exactly
	};
}


/********* Sign test *********/

Statistics.prototype.signTest = function(firstColumn, secondColumn) {
	if (typeof secondColumn === 'undefined') return this.errorMessage('Sign test: No data was supplied.');

	let validatedFirst = this.validateInput(firstColumn, 'ordinal', 'sign test'),
		validatedSecond = this.validateInput(secondColumn, 'ordinal', 'sign test');
	if (validatedFirst === false || validatedSecond === false) return;
	if (validatedFirst.length === 0 || validatedSecond.length === 0) return;

	let reduced = this.reduceToPairs(validatedFirst.data, validatedSecond.data),
		missings = reduced.missings,
		length = reduced.length,
		valuesFirst = reduced.valuesFirst,
		valuesSecond = reduced.valuesSecond,
		positives = 0;

	for (var i = 0; i < length; i++) {
		if (valuesFirst[i] > valuesSecond[i]) positives += 1;
	}

	// test with binomial test even for lange n to increase accuracy

	let	exactly = this.binomialProbabilityMass(positives, length),
		fewer = this.binomialCumulativeValue(positives - 1, length),
		more = 1 - fewer - exactly;

	return {
			positives,
			pExactly: exactly,
			pFewer: fewer,
			pAtMost: fewer + exactly,
			pMore: more,
			pAtLeast: more + exactly
	};
}


/********* Fisher's exact test *********/

Statistics.prototype.fishersExactTest = function(firstColumn, secondColumn) {
	if (typeof secondColumn === 'undefined') return this.errorMessage("Fisher's exact test requires two columns to analyze.");
	let validated = this.contingencyTable(firstColumn, secondColumn, 'Fisher\'s exact test');
	if (typeof validated === 'undefined') return;

	let { a, b, c, d } = validated,
		fisher = this.binomialCoefficient(a + b, a) * this.binomialCoefficient(c + d, c) / this.binomialCoefficient(a + b + c + d, a + c);

	return fisher;
}



/********* Mann-Whitney U *********/

Statistics.prototype.mannWhitneyU = function(independentColumn, dependentColumn) {
	if (typeof dependentColumn === 'undefined') return this.errorMessage('Mann-Whitney-U test requires two columns to analyze.');

	let validatedIndependent = this.validateInput(independentColumn, 'nominal', 'Mann-Whitney-U test'),
		validatedSecond = this.validateInput(dependentColumn, 'ordinal', 'Mann-Whitney-U test');
	if (validatedIndependent === false || validatedSecond === false) return;
	if (validatedIndependent.length === 0 || validatedSecond.length === 0) return;

	let dataset = this.sort(validatedSecond.data),
		uniqueValues = this.getUniqueValues(validatedIndependent.data);

	if (uniqueValues.length !== 2) return this.errorMessage('The Mann-Whitney-U test requires the independent variable to have exactly two unique values. Variable "' + independentValue + '" has ' + uniqueValues.length + ' different values: ' + validatedIndependent.data.join(', '));
	
	let	ranks = this.assignRanks(dependentColumn),
		rankSumFirst = ranks.reduce((acc, val) => { return (val[independentColumn] === uniqueValues[0]) ? acc + val['rank-' + dependentColumn] : acc; }, 0),
		nFirst = ranks.reduce((acc, val) => { return (val[independentColumn] === uniqueValues[0]) ? acc + 1 : acc; }, 0);

	let	rankSumSecond = ranks.reduce((acc, val) => { return (val[independentColumn] === uniqueValues[1]) ? acc + val['rank-' + dependentColumn] : acc; }, 0),
		nSecond = ranks.reduce((acc, val) => { return (val[independentColumn] === uniqueValues[1]) ? acc + 1 : acc; }, 0);

	let uValue1 = nFirst * (0.5 * nFirst + nSecond + 0.5) - rankSumFirst,
		uValue2 = nSecond * (0.5 * nSecond + nFirst + 0.5) - rankSumSecond,
		uValue = Math.min(uValue1, uValue2);

	// calculate z and determine p value
	let zValue = (uValue - 0.5 * nFirst * nSecond) / Math.sqrt(nFirst * nSecond * (nFirst + nSecond + 1) / 12),
		p = 1 - this.normalCumulativeValue(Math.abs(zValue)),
		result = {
			MannWhitneyU: 	uValue,
			zScore: 		zValue,
			pOneTailed: 	p,
			pTwoTailed:		2 * p
		};

	return result;
}


/********* Chi Squared Test *********/

Statistics.prototype.chiSquaredTest = function(firstColumn, secondColumn) {
	if (typeof secondColumn === 'undefined') return this.errorMessage('Chi Squared Test: You need to specify two variables, either of nominal or ordinal scale.');

	let scaleFirst = this.getScale(firstColumn),
		scaleSecond = this.getScale(secondColumn);
	if ((scaleFirst !== 'ordinal' && scaleFirst !== 'nominal') || (scaleSecond !== 'ordinal' && scaleSecond !== 'nominal'))
		return this.errorMessage('Chi Squared Test: Both variables need to be either of nominal or ordinal scale.');


	// fetch crossTable, calculate critical value and degrees of freedom
	let contingencyTable = this.contingencyTable(firstColumn, secondColumn);
	if (typeof contingencyTable === 'undefined') return this.errorMessage('Chi Squared Test: Failed to create a contingency table. Please make sure your data is prepared correctly.');
	contingencyTable = contingencyTable.detailled;

	let total = contingencyTable['total']['total'],
		criticalValue = 0,
		degreesFreedom = (Object.keys(contingencyTable).length - 1);
	degreesFreedom = (degreesFreedom - 1) * (Object.keys(contingencyTable['total']).length - degreesFreedom - 2);

	for (var row in contingencyTable) {
		if (this.has(contingencyTable, row) && row !== 'total') {
			let rowTotal = contingencyTable[row]['total'];

			for (var col in contingencyTable[row]) {
				if (this.has(contingencyTable[row], col) && col !== 'total') {
					let colTotal = contingencyTable['total'][col],
						expected = rowTotal * colTotal / total;
					criticalValue += Math.pow(contingencyTable[row][col] - expected, 2) / expected;
				}
			}
		}
	}

	// calculate Chi squared
	let p;

	if (criticalValue < 0 || degreesFreedom < 1) {
		p = 0;
	} else {
		p = 1 - this.chiSquaredCumulativeValue(criticalValue, degreesFreedom);
	}

	return {
		PearsonChiSquared:	criticalValue,
		degreesOfFreedom:	degreesFreedom,
		significance: 		p
	};
}