/********* Algebra *********/


// trivial sum for smaller sets of values or
// integer values

Statistics.prototype.sum = function(data) {
	if (typeof data === 'undefined') return this.errorMessage('Sum: No data given.');
	if (typeof data === 'string' && this.has(this.columns, data)) data = this.getColumn(data);
	if (data.length == 0) return;

	return data.reduce((a, b) => { return (this.isNumeric(b)) ? (a + b) : a; }, 0);
}


// Kahan's summation algorithm to reduce numerical error
// in large sets floating point values
// https://en.wikipedia.org/wiki/Kahan_summation_algorithm

Statistics.prototype.sumExact = function(data) {
	if (typeof data === 'undefined') return this.errorMessage('Sum exact: No data given.');
	if (typeof data === 'string' && this.has(this.columns, data)) data = this.getColumn(data);
	if (data.length == 0) return;

	let sum = 0.0,
		compensation = 0.0;

	for (var i = 0; i < data.length; i++) {
		let y = (this.isNumeric(data[i])) ? data[i] : 0;
		y -= compensation;
		let t = sum + y;
		compensation = (t - sum) - y;
		sum = t;
	}
	return sum; 
}

Statistics.prototype.product = function(data) {
	if (typeof data === 'undefined') return this.errorMessage('Product: No data given.');
	if (typeof data === 'string' && this.has(this.columns, data)) data = this.getColumn(data);
	if (data.length === 0) return 1;

	return data.reduce((a, b) => { return (this.isNumeric(b)) ? (a * b) : a; }, 1);
}


Statistics.prototype.factorial = function(n) {
	if (this.isNumeric(n) && !Number.isInteger(n)) return this.gamma(n);
	return (typeof this.factorials[n] !== 'undefined') ? this.factorials[n] : this.computeFactorial(n);
}


Statistics.prototype.computeFactorial = function(n) {
	if (typeof n === 'undefined' || !this.isNumeric(n) || n < 0) return;
	if (typeof this.factorials[n] !== 'undefined') return this.factorials[n];
	if (!Number.isInteger(n)) return this.gamma(n);

	let f = 1,
		i = 1;
		
	while (n > i) {
		i++;
		f *= i;
		if (typeof this.factorials[i] === 'undefined')
			this.factorials[i] = f;
	}

	return f;
}

/********* Binomial coefficient *********/

Statistics.prototype.binomialCoefficient = function(n = 1, k = 1) {
	if (n < k || k < 0) return this.errorMessage('The binomial coefficient is only defined for n and k with n ≥ k ≥ 0. N is ' + n + ' and k is ' + k + '.');
	if (!Number.isInteger(n) || !Number.isInteger(k)) return this.errorMessage('The binomial coefficient is only defined for integers n and k.');

	let factors = [];
	for (var i = 1; i <= k; i++) {
		factors.push((n + 1 - i) / i);
	}
	return this.product(factors);
}


/********* Gamma function *********/

Statistics.prototype.gamma = function(n, moreExact = false) {
	if (typeof n === 'undefined' || !this.isNumeric(n) || n < 0) return;
	if (Number.isInteger(n) && typeof this.factorials[n - 1] !== 'undefined') return this.factorials[n - 1];

	return (moreExact) ? this.gammaSpouge(n) : this.gammaStirling(n);
}



// Spouge approximation of the Gamma Function
// https://en.wikipedia.org/wiki/Spouge%27s_approximation

Statistics.prototype.gammaSpouge = function(n) {
	if (typeof n === 'undefined' || !this.isNumeric(n) || n < 0) return;
	if (Number.isInteger(n) && typeof this.factorials[n - 1] !== 'undefined') return this.factorials[n - 1];

	const a = this.spougeConstant;
	let sc = Math.pow(n + a, n + 0.5),
		f = 1,
		ck = 0,
		sum = Math.sqrt(2 * Math.PI);
	sc *= Math.exp(- n - a);
	sc /= n;

	for (var k = 1; k < a; k++) {
		n++;
		ck = Math.pow(a - k, k - 0.5);
		ck *= Math.exp(a - k);
		ck /= f;
		sum += ck / n;
		f *= -k;
	}

	return sum * sc;
}



// Stirling-Nemes approximation of the Gamma Function
// https://en.wikipedia.org/wiki/Stirling%27s_approximation#Versions_suitable_for_calculators

Statistics.prototype.gammaStirling = function(n) {
	if (typeof n === 'undefined' || !this.isNumeric(n) || n < 0) return;
	if (Number.isInteger(n) && typeof this.factorials[n - 1] !== 'undefined') return this.factorials[n - 1];
	
	let reciprocalE = 0.36787944117144232159552377016147,
		twoPi = 6.283185307179586476925286766559,
		gamma = 1.0 / (10.0 * n);
	gamma = 1.0 / ((12 * n) - gamma);
	gamma = (gamma + n) * reciprocalE;
	gamma = Math.pow(gamma, n);
	gamma *= Math.sqrt(twoPi / n);

	return gamma;
}

Statistics.prototype.incompleteGamma = function(s, x) {
	if (typeof x === 'undefined') return this.errorMessage('The incomplete lower gamma function is only defined for two numeric variables s and x.');
	if (!this.isNumeric(s) || !this.isNumeric(x)) return this.errorMessage('The incomplete lower gamma function is only defined for numeric variables s and x.');
	if (x < 0) return this.errorMessage('The incomplete lower gamma function is defined for x > 0.');


	let iterations = this.incompleteGammaIterations,
		fraction = 1;

	for (var i = 0; i < iterations; i++) {
		let n = iterations - i;
		fraction = x + (n - s) / (1 + n / fraction);
	}

	return this.gamma(s, true) - Math.exp(- x) * Math.pow(x, s) / fraction;
}

Statistics.prototype.regularisedGamma = function(s, x) {
	if (typeof x === 'undefined') return this.errorMessage('The regularised lower gamma function is only defined for two numeric variables s and x.');
	if (!this.isNumeric(s) || !this.isNumeric(x)) return this.errorMessage('The regularised lower gamma function is only defined for numeric variables s and x.');
	if (x < 0) return this.errorMessage('The regularised lower gamma function is defined for x > 0.');

	return this.incompleteGamma(s, x) / this.gamma(s, true);
}


/********* Beta function *********/

Statistics.prototype.beta = function(a, b) {
	if (typeof b === 'undefined') return this.errorMessage('The beta function is only defined for two numeric variables a and b.');
	if (!this.isNumeric(a) || !this.isNumeric(b)) return this.errorMessage('The beta function is only defined for numeric variables a and b.');
	if (a <= 0 || b <= 0) return this.errorMessage('The beta function is defined for a and b with a > 0 and b > 0.');
	// using factorial instead of gamma function to gain more precision for integer values a and b,
	// as gamma function is only an approximation and errors can accumulate

	return (Number.isInteger(a) && Number.isInteger(b) && a > 0 && b > 0)
			? this.factorial(a - 1) * this.factorial(b - 1) / this.factorial(a + b - 1)
			: this.gamma(a, true) * this.gamma(b, true) / this.gamma(a + b, true);
}

Statistics.prototype.incompleteBeta = function(x, a, b) {
	if (typeof b === 'undefined') return this.errorMessage('The incomplete beta function is only defined for two numeric variables a and b.');
	if (!this.isNumeric(x) || !this.isNumeric(a) || !this.isNumeric(b)) return this.errorMessage('The incomplete beta function is only defined for numeric variables x, a and b.');
	if (x < 0.0 || x > 1.0) return this.errorMessage('The incomplete beta function is defined for x ≥ 0 and x ≦ 1.');
	if (a <= 0 || b <= 0) return this.errorMessage('The incomplete beta function is defined for a and b with a > 0 and b > 0.');
	if (x == 1) return this.beta(a, b);

	var getR = function(r, a, b, x) {
		if (r % 2 == 0) {
			let k = 0.5 * r;
			return k * (b - k) * x / ((a + 2 * k - 1) * (a + 2 * k));
		} else {
			let k = 0.5 * r - 0.5;
			return - (a + k) * (a + b + k) * x / ((a + 2 * k) * (a + 2 * k  + 1));
		}
	}

	let factor = Math.pow(x, a) * Math.pow(1 - x, b) / a;
	let iterations = this.incompleteBetaIterations,
		fraction = 1;

	for (var i = 0; i < iterations; i++) {
		let r = iterations - i;
		fraction = 1 + getR(r, a, b, x) / fraction;
	}

	let beta = factor / fraction;
	return beta;
}

Statistics.prototype.regularisedBeta = function(x, a, b) {
	if (typeof b === 'undefined') return this.errorMessage('The regularised beta function is only defined for two numeric variables a and b.');
	if (!this.isNumeric(x) || !this.isNumeric(a) || !this.isNumeric(b)) return this.errorMessage('The regularised beta function is only defined for numeric variables x, a and b.');
	if (x > 1 || x < 0) return this.errorMessage('The regularised beta function is defined for x ≥ 0 and x ≦ 1.');
	if (a <= 0 || b <= 0) return this.errorMessage('The regularised beta function is defined for a and b with a > 0 and b > 0.');

	if (!Number.isInteger(a) || !Number.isInteger(b))
		return this.incompleteBeta(x, a, b) / this.beta(a, b);

	let summand = this.epsilon + 1,
		j = a,
		sum = 0;

	while (summand >= this.epsilon) {
		summand = this.binomialCoefficient(b + j - 1, j) * Math.pow(x, j);
		sum += summand;
		j++;
	}

	return sum * Math.pow(1 - x, b);
}

