/********* Fisher Yates Shuffle *********/

Statistics.prototype.fisherYatesShuffle = function(data, randomSource = Math.random) {
	if (typeof data === 'undefined') return this.errorMessage('Fisher-Yates shuffle: No data given.');
	
	let validated = this.validateInput(data, 'nominal', '');
	if (validated === false) return;

	let values = validated.data,
		n = validated.length,
		swap, i;

	while (n) {
		i = Math.floor(randomSource() * n--);
		swap = values[n];
		values[n] = values[i];
		values[i] = swap;
	}

	return values;
}


/********* Xorshift *********

variation of /u/uupaa's implementation
https://github.com/uupaa/Random.js

The MIT License (MIT)

Copyright (c) 2014 uupaa

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

*****/

Statistics.prototype.xorshift = function(seed, startIndex = 0) {
	if (typeof seed === 'undefined' || seed.constructor !== Array || seed.length !== 4)
		return this.errorMessage('Xorshift needs to be seeded with an array consisting of four numbers.');
	if (!Number.isInteger(startIndex) || startIndex < 0)
		return this.errorMessage('Xorshift: startIndex must be a non-negative integer.');

	const bufferStart = 4;
	const bufferEnd = 64;

	let index = 0,
		cursor = bufferStart;

	let buffer = new Uint32Array(bufferEnd);
	buffer[0] = seed[0];
	buffer[1] = seed[1];
	buffer[2] = seed[2];
	buffer[3] = seed[3];

	const bufferFlood = function(buffer, start, end) {
		for (var i = start; i < end; i++) {
			let t = (buffer[0] ^ (buffer[0] << 11)) >>> 0;

			buffer[0] = buffer[1];
			buffer[1] = buffer[2];
			buffer[2] = buffer[3];
			buffer[3] = (((buffer[3] ^ (buffer[3] >>> 19)) >>> 0) ^ ((t ^ (t >>> 8)) >>> 0)) >>> 0;

			buffer[i] = buffer[3];
		}

		return buffer;
	}

	this.next = function(normalise = true) {
		let result = buffer[cursor];
		index += 1;

		if (cursor++ >= bufferEnd) {
			cursor = bufferStart;
			bufferFlood(buffer, bufferStart, bufferEnd);
		}

		return normalise ? result / 0x100000000 : result;
	}

	buffer = bufferFlood(buffer, bufferStart, bufferEnd);
	for (var i = 0, j = startIndex; i < j; i++) {
		this.next();
	}

}


/********* Box-Muller transform *********/

Statistics.prototype.boxMuller = function(mean = 0, standardDeviation = 1, {
		randomSourceA: randomSourceA = Math.random,
		randomSourceB: randomSourceB = Math.random
	} = {}) {

	let u1 = 0,
		u2 = 0,
		i1 = 0,
		i2 = 0;

	// try up to 50 times to generate a normally distributed seeding number
	// from the interval (0, 1)
	do {
		u1 = randomSourceA();
		i1 += 1;
	} while ((u1 <= 0 || u1 >= 1) && i1 < 50);

	do {
		u2 = randomSourceB();
		i2 += 1;
	} while ((u2 <= 0 || u2 >= 1) && i2 < 50);
	
	// otherwise use Math.random()	
	while (u1 <= 0 || u1 >= 1)
		u1 = Math.random();

	while (u2 <= 0 || u2 >= 1)
		u2 = Math.random();

	let normal = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
	return normal * standardDeviation + mean;
}


/********* Ziggurat algorithm *********/

Statistics.prototype.ziggurat = function(mean = 0, standardDeviation = 1) {
	let seed = 123456789,
		wn = [128],
		fn = [128],
		kn = [128];

	const residueVariator = function(hz, iz) {
		let r = 3.442619855899,
			r1 = 1 / r,
			x, y;

		while (true) {
			x = hz * wn[iz];
			if (iz === 0) {
				x = (- Math.log(uniformInteger()) * r1);
				y = - Math.log(uniformInteger());

				while (y + y < x * x) {
					x = (- Math.log(uniformInteger()) * r1);
					y = - Math.log(uniformInteger()); 
				}

				return (hz > 0) ? r + x : - r - x;
			}

			if (fn[iz] + uniformInteger() * (fn[iz - 1] - fn[iz]) < Math.exp(-0.5 * x * x))
				return x;

			hz = generateInteger();
			iz = hz & 127;

			if (Math.abs(hz) < kn[iz])
				return hz * wn[iz];
		}
	}

	const generateInteger = function() {
		let jz = seed,
			jzr = seed;

		jzr ^= (jzr << 13);
		jzr ^= (jzr >>> 17);
		jzr ^= (jzr << 5);
		seed = jzr;

		return (jz + jzr) | 0;
	}

	const uniformInteger = function() {
		return 0.5 * (1 + generateInteger() / - Math.pow(2, 31));
	}

	const generateSeed = function() {
		seed ^= new Date().getTime();

		let m1 = 2147483648,
			dn = 3.442619855899,
			tn = dn,
			vn = 9.91256303526217E-3,
			q = vn / Math.exp(-0.5 * dn * dn);

		kn[0] = Math.floor(dn * m1 / q);
		kn[1] = 0;

		wn[0] = q / m1;
		wn[127] = dn / m1;

		fn[0] = 1.0;
		fn[127] = Math.exp(-0.5 * dn * dn);

		for (var i = 126; i >= 1; i--) {
			dn = Math.sqrt(-2 * Math.log(vn / dn + Math.exp(-0.5 * dn * dn)));
			kn[i+1] = Math.floor(dn * m1 / tn);
			tn = dn;
			fn[i] = Math.exp(-0.5 * dn * dn);
			wn[i] = dn / m1;
		}
	}

	generateSeed();

	this.next = function() {
		let hz = generateInteger(),
			iz = hz & 127;

		let normal = (Math.abs(hz) < kn[iz]) ? hz * wn[iz] : residueVariator(hz, iz);
		return normal * standardDeviation + mean;
	}


}