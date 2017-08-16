/********* Gaussian Error *********/

Statistics.prototype.gaussianError = function(x) {
	if (typeof x === 'undefined' || !this.isNumeric(x)) return this.errorMessage('Gaussian Error Function: No valid value for x supplied. X needs to be numeric.');

	let t = 1 / (1 + 0.5 * Math.abs(x)),
		tau = - x * x - 1.26551223 + 1.00002368 * t + 0.37409196 * t * t +
				0.09678418 * Math.pow(t, 3) - 0.18628806 * Math.pow(t, 4) +
				0.27886807 * Math.pow(t, 5) - 1.13520398 * Math.pow(t, 6) +
				1.48851587 * Math.pow(t, 7) - 0.82215223 * Math.pow(t, 8) +
				0.17087277 * Math.pow(t, 9);

		tau = Math.exp(tau) * t;

	return (x >= 0) ? 1 - tau : tau - 1;
}

Statistics.prototype.inverseGaussianError = function(x) {
	if (typeof x === 'undefined' || !this.isNumeric(x)) return this.errorMessage('Inverse Gaussian Error Function: No valid value for x supplied. X needs to be numeric.');
	if (x > 1) return this.errorMessage('Inverse Gaussian Error Function: x can not be larger than 1.');
	if (x < -1) return this.errorMessage('Inverse Gaussian Error Function: x can not be smaller than -1.');

	var w = - Math.log((1.0 - x) * (1.0 + x)),
		p;

	if (w < 5) {
		w = w - 2.5;
		p = Number(3.43273939E-7) + Number(2.81022636E-8) * w;
		p = Number(-3.5233877E-6) + p * w;
		p = Number(-4.39150654E-6) + p * w;
		p = 0.00021858087 + p * w;
		p = -0.00125372503 + p * w;
		p = -0.00417768164 + p * w;
		p = 0.246640727 + p * w;
		p = 1.50140941 + p * w;
	} else {
		w = Math.sqrt(w) - 3;
		p = 0.000100950558 -0.000200214257 * w;
		p = 0.00134934322 + p * w;
		p = -0.00367342844 + p * w;
		p = 0.00573950773 + p * w;
		p = -0.0076224613 + p * w;
		p = 0.00943887047 + p * w;
		p = 1.00167406 + p * w;
		p = 2.83297682 + p * w;
	}

	return (p * x).toFixed(7);
}


/********* Probit *********/

Statistics.prototype.probit = function(quantile) {
	if (typeof quantile === 'undefined' || !this.isNumeric(quantile)) return this.errorMessage('Probit: No valid value for quantile supplied. quantile needs to be numeric.');
	if (quantile < 0 || quantile > 1) return this.errorMessage('Probit is only defined for quantiles p with 1 ≥ p ≥ 0.');

	if (quantile === 0) return -Infinity;
	if (quantile === 1) return Infinity;

	return Math.sqrt(2) * this.inverseGaussianError(2 * quantile - 1);
}