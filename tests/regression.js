'use strict';

let assert = require('assert');
let Statistics = require('../statistics.js'),
	options = { suppressWarnings: true },
	statsTooLow = new Statistics([{ a: 1 }, { a: 2 }, { a: 3 }], { a: 'nominal' }, options);


/********************************
	Linear regression
 ********************************/

describe(".linearRegression()", () => {
	//	https://en.wikipedia.org/wiki/Simple_linear_regression#Numerical_example
	let example1Values = [
			{ height: 1.47, mass: 52.21 },
			{ height: 1.50, mass: 53.12 },
			{ height: 1.52, mass: 54.48 },
			{ height: 1.55, mass: 55.84 },
			{ height: 1.57, mass: 57.20 },
			{ height: 1.60, mass: 58.57 },
			{ height: 1.63, mass: 59.93 },
			{ height: 1.65, mass: 61.29 },
			{ height: 1.68, mass: 63.11 },
			{ height: 1.70, mass: 64.47 },
			{ height: 1.73, mass: 66.28 },
			{ height: 1.75, mass: 68.10 },
			{ height: 1.78, mass: 69.92 },
			{ height: 1.80, mass: 72.19 },
			{ height: 1.83, mass: 74.46 },
		],
		example1Vars = { height: 'metric', mass: 'metric' },
	//	https://de.wikipedia.org/wiki/Einfache_lineare_Regression#Einf.C3.BChrendes_Beispiel
		example2Values = [
			{ price: 20, sold: 0 },
			{ price: 16, sold: 3 },
			{ price: 15, sold: 7 },
			{ price: 16, sold: 4 },
			{ price: 13, sold: 6 },
			{ price: 10, sold: 10 }
		],
		example2Vars = { price: 'metric', sold: 'metric' };

	let stats1 = new Statistics(example1Values, example1Vars, options),
		stats2 = new Statistics(example2Values, example2Vars, options),
		result1 = stats1.linearRegression('height', 'mass'),
		result2 = stats2.linearRegression('price', 'sold'),
		threshhold = stats1.epsilon;

	it("should compute the correct value for several examples", () => {
		assert.equal(Math.abs(result1.coefficientOfDetermination - 0.9891969224) < threshhold, true);
		assert.equal(Math.abs(result1.coefficientOfDeterminationCorrected - 0.9883659164) < threshhold, true);
		assert.equal(Math.abs(result1.correlationCoefficient - 0.99458379357) < threshhold, true);
		assert.equal(Math.abs(result1.regressionFirst.beta1 + 39.0619559188) < threshhold, true);
		assert.equal(Math.abs(result1.regressionFirst.beta2 - 61.2721865421) < threshhold, true);
		assert.equal(Math.abs(result1.regressionSecond.beta1 - 0.6484604452) < threshhold, true);
		assert.equal(Math.abs(result1.regressionSecond.beta2 - 0.0161443058) < threshhold, true);
		assert.equal(Math.abs(result1.phi - 5.96597526) < threshhold, true);

		assert.equal(Math.abs(result2.coefficientOfDetermination - 0.900297619) < threshhold, true);
		assert.equal(Math.abs(result2.coefficientOfDeterminationCorrected - 0.8753720238) < threshhold, true);
		assert.equal(Math.abs(result2.correlationCoefficient + 0.9488401441) < threshhold, true);
		assert.equal(Math.abs(result2.regressionFirst.beta1 - 19.73214286) < threshhold, true);
		assert.equal(Math.abs(result2.regressionFirst.beta2 + 0.9821428571) < threshhold, true);
		assert.equal(Math.abs(result2.regressionSecond.beta1 - 19.58333333) < threshhold, true);
		assert.equal(Math.abs(result2.regressionSecond.beta2 + 0.916666666) < threshhold, true);
		assert.equal(Math.abs(result2.phi - 18.4065094711) < threshhold, true);
	});

	it("should return undefined if only one or no columns are given", () => {
		assert.equal(stats1.linearRegression('age'), undefined);
		assert.equal(stats1.linearRegression('abc'), undefined);
		assert.equal(stats1.linearRegression(), undefined);
	});

	it("should return undefined if the scale is too low", () => {
		assert.equal(statsTooLow.linearRegression(), undefined);
	});
});
