/********* Normal distribution *********/

Statistics.prototype.normalProbabilityDensity = function(x, mean = 0, variance = 1) {
	if (typeof x === 'undefined') return this.errorMessage('Normal probability density: no x is given.');
	if (variance <= 0) return this.errorMessage('Normal probability density: variance must be larger than 0.');

	let y = - Math.pow(x - mean, 2) / (2 * variance);
	return Math.exp(y) / Math.sqrt(2 * Math.PI * variance);
}

Statistics.prototype.normalDistribution = function(mean = 0, variance = 1) {
	if (variance <= 0) return this.errorMessage('Normal distribution: variance must be larger than 0.');

	let x = 0,
		p = 1,
		distribution = {};

	while (p >= this.epsilon) {
		p = this.normalProbabilityDensity(mean + x, mean, variance);

		if (p < this.epsilon) break;

		distribution[(mean + x).toFixed(2)] = p;
		distribution[(mean - x).toFixed(2)] = p;

		x += 0.01;
	}

	return distribution;
}


/********* Normal cumulative distribution *********/

Statistics.prototype.normalCumulativeValue = function(z) {
	if (typeof z === 'undefined') return this.errorMessage('Normal cumulative value: no z is given.');

	let sum = z,
		product = z;

	for (var i = 1; i < this.zTableIterations; i++) {
		product *= z * z / (2 * i + 1);
		sum += product;
	}

	return Math.round((0.5 + (sum / Math.sqrt(2 * Math.PI)) * Math.exp(-0.5 * z * z)) * 1e5) / 1e5;
}

Statistics.prototype.normalCumulativeDistribution = function() {
	let table = this.zTable;
	if (typeof table === 'undefined') {
		table = {};
		for (var z = 0; z <= 4.09; z += 0.01) {
			let float = Math.round(z * 100) / 100;
			table[float.toFixed(2)] = this.normalCumulativeValue(z);
		}
		
		this.zTable = table;
	}

	return table;
}


/********* Binomial distribution *********/

Statistics.prototype.binomialProbabilityMass = function(k, n = 10, probability = 0.5) {
	if (typeof k === 'undefined') return this.errorMessage('Binomial probability mass: the required argument k was not given.');
	if (k < 0 || !Number.isInteger(k)) return this.errorMessage('Binomial probability mass: k must be a non-negative integer.');
	if (n < 0 || !Number.isInteger(n)) return this.errorMessage('Binomial probability mass: n must be a non-negative integer.');
	if (probability < 0 || probability > 1) return this.errorMessage('Binomial probability mass: The probability must lie within the range of [0, 1].');

	return this.binomialCoefficient(n, k) * Math.pow(probability, k) * Math.pow(1 - probability, n - k);
}

Statistics.prototype.binomialDistribution = function(n = 10, probability = 0.5) {
	if (n < 0 || !Number.isInteger(n)) return this.errorMessage('Binomial distribution: n must be a non-negative integer.');
	if (probability < 0 || probability > 1) return this.errorMessage('Binomial distribution: The probability must lie within the range of [0, 1].');

	let y = 0,
		p = 0,
		probabilitySum = 0,
		distribution = [],
		binomialCoefficient = 1;

	while (y <= n) {
		p = binomialCoefficient * Math.pow(probability, y) * Math.pow(1 - probability, n - y);
		distribution.push(p);
		probabilitySum += p;
		y++;
		binomialCoefficient = binomialCoefficient * (n + 1 - y) / y;
	}
	
	return distribution;
}



/********* Binomial cumulative distribution *********/

Statistics.prototype.binomialCumulativeValue = function(k, n = 10, probability = 0.5) {
	if (typeof k === 'undefined') return this.errorMessage('Binomial cumulative distribution value: the required argument k was not given.');
	if (k < 0 || !Number.isInteger(k)) return this.errorMessage('Binomial cumulative distribution value: k must be a non-negative integer.');
	if (n < 0 || !Number.isInteger(n)) return this.errorMessage('Binomial cumulative distribution value: n must be a non-negative integer.');
	if (probability < 0 || probability > 1) return this.errorMessage('Binomial cumulative distribution value: The probability must lie within the range of [0, 1].');

	return this.regularisedBeta(1 - probability, n - k, k + 1);
}

Statistics.prototype.binomialCumulativeDistribution = function(n = 10, probability = 0.5) {
	if (n < 0 || !Number.isInteger(n)) return this.errorMessage('Binomial cumulative distribution: n must be a non-negative integer.');
	if (probability < 0 || probability > 1) return this.errorMessage('Binomial cumulative distribution: The probability must lie within the range of [0, 1].');

	let distribution = this.binomialDistribution(n, probability),
		sum = 0;

	return distribution.map(function(item) {
		sum = this.sumExact([sum, item]);
		return sum;
	}, this);
}



/********* Poisson distribution *********/

Statistics.prototype.poissonProbabilityMass = function(k, lambda = 1) {
	if (typeof k === 'undefined' || !Number.isInteger(k)) return this.errorMessage('Poisson probability mass: the required argument k must be an integer.');
	if (k < 0 || lambda <= 0) return this.errorMessage('Poisson probability mass: Both k and lambda must be larger than 0.');

	// use a more numerically stable iterative computation for larger k to avoid
	// extremely large values for lambda^k and k! and loss of precision
	// which will lead to way too large results

	if (k > 10) {
		let result = 1;

		for (var i = 1; i <= k; i++) {
			result *= lambda * Math.exp(-lambda/k) / i;
		}

		return result;

	} else {
		return Math.exp(- lambda) * Math.pow(lambda, k) / this.factorial(k);
	}
}


Statistics.prototype.poissonDistribution = function(lambda = 1) {
	if (lambda <= 0) return this.errorMessage('Poisson distribution: Lambda must be larger than 0.');

	let x = 0,
		probabilitySum = 0,
		distribution = [];

	while (probabilitySum < 1 - this.epsilon) {
		let p = this.poissonProbabilityMass(x, lambda);
		distribution.push(p);
		probabilitySum += p;
		x++;
	}
	
	return distribution;
}


/********* Poisson cumulative distribution *********/

Statistics.prototype.poissonCumulativeValue = function(k, lambda = 1) {
	if (typeof k === 'undefined' || !Number.isInteger(k)) return this.errorMessage('Poisson cumulative distribution: The number of cumulative events k must be supplied.');
	if (k < 0 || lambda <= 0) return this.errorMessage('Poisson distribution: Both k and lambda must be larger than 0.');

	let distribution = this.poissonDistribution(lambda);
	return (k < distribution.length - 1) ? this.sumExact(distribution.slice(0, k + 1)) : 1;
}


Statistics.prototype.poissonCumulativeDistribution = function(lambda = 1) {
	if (lambda <= 0) return this.errorMessage('Poisson distribution: lambda must be larger than 0.');

	let distribution = this.poissonDistribution(lambda),
		sum = 0;

	return distribution.map(function(item) {
		sum = this.sumExact([sum, item]);
		return sum;
	}, this);
}



/********* Student's t distribution *********/

Statistics.prototype.studentsTProbabilityDensity = function(t, df) {
	if (typeof df === 'undefined') return this.errorMessage('Student\'s t-distribution probability density: no value for degrees of freedom (df) given.');
	if (df <= 0) return this.errorMessage('Student\'s t-distribution probability density: degrees of freedom (df) must be larger than 0.');

	let spd = Math.pow(1 + (t * t) / df, -0.5 * (df + 1));
	spd /= Math.sqrt(df) * this.beta(0.5, 0.5 * df);

	return spd;
}

Statistics.prototype.studentsTDistribution = function(df) {
	if (typeof df === 'undefined') return this.errorMessage('Student\'s t-distribution: no value for degrees of freedom (df) given.');
	if (df <= 0) return this.errorMessage('Student\'s t-distribution: degrees of freedom (df) must be larger than 0.');

	let t = 0,
		p = 1,
		distribution = {};

	while (p >= this.epsilon) {
		p = this.studentsTProbabilityDensity(t, df);

		if (p < this.epsilon) break;

		distribution[(t).toFixed(2)] = p;
		distribution[(- t).toFixed(2)] = p;

		t += 0.01;
	}

	return distribution;
}


/********* Student's cumulative distribution *********/

Statistics.prototype.studentsTCumulativeValue = function(t, df) {
	if (typeof df === 'undefined') return this.errorMessage('Student\'s cumulative t-distribution value: no value for degrees of freedom (df) given.');
	if (df <= 0) return this.errorMessage('Student\'s cumulative t-distribution value: degrees of freedom (df) must be larger than 0.');

	if (t <= 0) {
		return 0.5 * this.regularisedBeta(df / (t * t + df), 0.5 * df, 0.5);
	} else {
	//	let x = Math.sqrt(t * t + df);
	//	x = (t + x) / (2 * x);
	//	x = this.regularisedBeta(x, 0.5 * df, 0.5 * df);

		return 0.5 + 0.5 * this.regularisedBeta(t * t / (t * t + df), 0.5, 0.5 * df);
	}
}


Statistics.prototype.studentsTCumulativeDistribution = function(df) {
	if (typeof df === 'undefined') return this.errorMessage('Student\'s cumulative t-distribution: no value for degrees of freedom (df) given.');
	if (df <= 0) return this.errorMessage('Student\'s cumulative t-distribution: degrees of freedom (df) must be larger than 0.');

	let t = 0,
		p = 0,
		oldP = -0.1,
		distribution = {};

	while (p <= 1 - this.epsilon) {
		p = this.studentsTCumulativeValue(t, df);

		if (oldP >= p) break;

		distribution[(t).toFixed(2)] = p;
		distribution[(-t).toFixed(2)] = p;
		oldP = p;
		t += 0.01;
	}

	return distribution;
}


/********* Chi squared distribution *********/

Statistics.prototype.chiSquaredProbabilityDensity = function(x, df) {
	if (typeof df === 'undefined') return this.errorMessage('Chi squared distribution probability density: no value for degrees of freedom (df) given.');
	if (df <= 0) return this.errorMessage('Chi squared distribution probability density: degrees of freedom (df) must be larger than 0.');

	if (x <= 0)
		return 0;

	return Math.pow(x, 0.5 * df - 1) * Math.exp(-0.5 * x) / (Math.pow(2, 0.5 * df) * this.gamma(0.5 * df, true));
}

Statistics.prototype.chiSquaredDistribution = function(df) {
	if (typeof df === 'undefined') return this.errorMessage('Chi squared distribution: no value for degrees of freedom (df) given.');
	if (df <= 0) return this.errorMessage('Chi squared distribution: degrees of freedom (df) must be larger than 0.');

	let x = 0.01,
		p = 1,
		distribution = { '0.00': 0 };

	while (
			(df <= 2 && p >= this.epsilon) ||		// account for maximum if df > 2
			(df > 2 && x <= df - 2) ||
			(df > 2 && p >= this.epsilon)
		) {

		p = this.chiSquaredProbabilityDensity(x, df);

		if (p < this.epsilon && x >= df - 2 && df > 2) break;

		distribution[(x).toFixed(2)] = p;
		x += 0.01;
	}

	return distribution;
}


/********* Chi squared cumulative distribution *********/

Statistics.prototype.chiSquaredCumulativeValue = function(x, df) {
	if (typeof df === 'undefined') return this.errorMessage('Chi squared cumulative distribution value: no value for degrees of freedom (df) given.');
	if (df <= 0) return this.errorMessage('Chi squared cumulative distribution value: degrees of freedom (df) must be larger than 0.');

	return (x <= 0) ? 0 : this.regularisedGamma(0.5 * df, 0.5 * x);
}

Statistics.prototype.chiSquaredCumulativeDistribution = function(df) {
	if (typeof df === 'undefined') return this.errorMessage('Chi squared cumulative distribution: no value for degrees of freedom (df) given.');
	if (df <= 0) return this.errorMessage('Chi squared cumulative distribution: degrees of freedom (df) must be larger than 0.');

	let x = 0.01,
		p = 0,
		distribution = { '0.00': 0 };

	while (p <= 1 - this.epsilon) {
		p = this.chiSquaredCumulativeValue(x, df);

		if (p >= 1 - this.epsilon) break;
		if (p > 0) distribution[(x).toFixed(2)] = p;
		x += 0.01;
	}

	return distribution;
}