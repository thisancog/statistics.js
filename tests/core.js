'use strict';

let assert = require('assert');
let Statistics = require('../statistics.js'),
	options = { suppressWarnings: true },
	stats = new Statistics([{ a: 2, b: 12 }, { a: 1, b: 4 }, { a: 3, b: 9 }, { a: 4 }], { a: 'nominal', b: 'metric' }, options);

let threshhold = stats.epsilon;


/********************************
	Get scale and set scale
 ********************************/

describe(".getScale() and .setScale()", () => {
	it("should get and set the scale correctly", () => {
		assert.equal(stats.setScale('a', 'metric'), true);
		assert.equal(stats.getScale('a'), 'metric');
		assert.equal(stats.setScale('a', 'nominal'), true);	// undo former line
	});

	it("should refuse to set an unknown scale and return false", () => {
		assert.equal(stats.setScale('a', 'something'), false);
		assert.equal(stats.getScale('a'), 'nominal');
	});

	it("should return false if the column does not exist", () => {
		assert.equal(stats.getScale('something'), undefined);
		assert.equal(stats.setScale('something', 'nominal'), false);
	});

	it("should return undefined/false if no scale is given", () => {
		assert.equal(stats.getScale(), undefined);
		assert.equal(stats.setScale(), false);
	});
});


/********************************
	Get column
 ********************************/

describe(".getColumn()", () => {
	it("should get the correct values in the same order as in the data", () => {
		assert.deepEqual(stats.getColumn('a'), [ 2, 1, 3, 4 ]);

		// assert does not work for NaN because of its unusual nature defined in IEEE754
		// as not being equal to itself
		assert.equal(stats.getColumn('b')[0], 12);
		assert.equal(stats.getColumn('b')[1], 4);
		assert.equal(stats.getColumn('b')[2], 9);
		assert.equal(isNaN(stats.getColumn('b')[3]), true);
	});

	it("should return false if the column does not exist", () => {
		assert.equal(stats.getColumn('something'), undefined);
	});

	it("should return undefined if no column is given", () => {
		assert.equal(stats.getColumn(), undefined);
	});
});


/********************************
	Get unique values
 ********************************/

describe(".getUniqueValues()", () => {
	it("should reduce values and sort them correctly", () => {
		assert.deepEqual(stats.getUniqueValues([13, 4, 9, 7, 4, 5, 6, 13, 7, 5, 2, 1, 1, 3]), [1, 2, 3, 4, 5, 6, 7, 9, 13]);
		assert.deepEqual(stats.getUniqueValues('b'), [4, 9, 12]);
	});

	it("should return undefined if no data or no column is given", () => {
		assert.equal(stats.getUniqueValues(), undefined);
		assert.equal(stats.getUniqueValues([]), undefined);
	});
});


/********************************
	Reduce to pairs
 ********************************/

describe(".reduceToPairs()", () => {
	it("should reduce values to pairs", () => {
		let expected = {
			length: 3,
			missings: 1,
			valuesCombined: [{ a: 2, b: 12 }, { a: 1, b: 4 }, { a: 3, b: 9 }],
			valuesFirst: [ 2, 1, 3 ],
			valuesSecond: [ 12, 4, 9 ]
		};

		assert.deepEqual(stats.reduceToPairs('a', 'b'), expected);
	});

	it("should return undefined if only one or no column is given", () => {
		assert.equal(stats.reduceToPairs('a'), undefined);
		assert.equal(stats.reduceToPairs(), undefined);
	});
});



/****************************************************************
	Sort, sort column and sort data by column
 ****************************************************************/

describe(".sort(), .sortColumn() and .sortDataByColumn()", () => {
	it("should sort correctly", () => {
		assert.deepEqual(stats.sort([4, 9, 12, 3, 2]), [2, 3, 4, 9, 12]);
		assert.deepEqual(stats.sortColumn('a'), [1, 2, 3, 4]);

		assert.deepEqual(stats.sortDataByColumn('a')[0], { a: 1, b: 4 });
		assert.deepEqual(stats.sortDataByColumn('a')[1], { a: 2, b: 12 });
		assert.deepEqual(stats.sortDataByColumn('a')[2], { a: 3, b: 9 });
		assert.deepEqual(stats.sortDataByColumn('a')[3].a, 4);

		// assert does not work for NaN because of its unusual nature defined in IEEE754
		// as not being equal to itself
		assert.deepEqual(isNaN(stats.sortDataByColumn('a')[3].b), true);
	});

	it("should keep the original object untouched", () => {
		let arr = [4, 9, 12, 3, 2];
		stats.sortDataByColumn('b');

		assert.notDeepEqual(stats.sort(arr), arr);
		assert.notDeepEqual(stats.sortColumn('a'), stats.getColumn('a'));
	});

	it(".sortDataByColumn() should reorder the original data if setting is present", () => {
		assert.deepEqual(stats.sortDataByColumn('a', { changeOriginal: true }), stats.data);
	});

	it("should sort in descending order if specified", () => {
		assert.deepEqual(stats.sort([4, 9, 12, 3, 2], { order: 'desc' }), [12, 9, 4, 3, 2]);
		assert.deepEqual(stats.sortColumn('a', { order: 'desc' }), [4, 3, 2, 1]);

		// assert does not work for NaN because of its unusual nature defined in IEEE754
		// as not being equal to itself
		assert.deepEqual(stats.sortDataByColumn('a', { order: 'desc' })[0].a, 4);
		assert.deepEqual(isNaN(stats.sortDataByColumn('a', { order: 'desc' })[0].b), true);
		assert.deepEqual(stats.sortDataByColumn('a', { order: 'desc' })[1], { a: 3, b: 9 });
		assert.deepEqual(stats.sortDataByColumn('a', { order: 'desc' })[2], { a: 2, b: 12 });
		assert.deepEqual(stats.sortDataByColumn('a', { order: 'desc' })[3], { a: 1, b: 4 });
	});

	it("should return undefined if no data or no column is given", () => {
		assert.equal(stats.sort(), undefined);
		assert.equal(stats.sort([]), undefined);
		assert.equal(stats.sortColumn(), undefined);
		assert.equal(stats.sortDataByColumn(), undefined);
	});
});


/********************************
	Is numeric
 ********************************/

describe(".isNumeric()", () => {
	it("should detect numeric values correctly", () => {
		assert.equal(stats.isNumeric(2), true);
		assert.equal(stats.isNumeric(5.4), true);
		assert.equal(stats.isNumeric(0), true);
		assert.equal(stats.isNumeric(-2.6), true);
		assert.equal(stats.isNumeric(4/3), true);
		assert.equal(stats.isNumeric("12"), true);
		assert.equal(stats.isNumeric("13.5"), true);
		assert.equal(stats.isNumeric("-4.3"), true);
	});

	it("should detect non-numeric values correctly", () => {
		assert.equal(stats.isNumeric(NaN), false);
		assert.equal(stats.isNumeric(Infinity), false);
		assert.equal(stats.isNumeric(-Infinity), false);
		assert.equal(stats.isNumeric(""), false);
		assert.equal(stats.isNumeric("a"), false);
		assert.equal(stats.isNumeric("4/3"), false);
		assert.equal(stats.isNumeric([]), false);
		assert.equal(stats.isNumeric([1]), false);
		assert.equal(stats.isNumeric([1, 2]), false);
		assert.equal(stats.isNumeric({}), false);
		assert.equal(stats.isNumeric({ 1: 2 }), false);
		assert.equal(stats.isNumeric({ 1: 'a' }), false);
		assert.equal(stats.isNumeric({ a: 2 }), false);
		assert.equal(stats.isNumeric(false), false);
		assert.equal(stats.isNumeric(true), false);
		assert.equal(stats.isNumeric((function a () { return 1; })), false);
	});

	it("should return undefined if no variable is given", () => {
		assert.equal(stats.isNumeric(), undefined);
	});
});



/********************************
	Add data and add row
 ********************************/

describe(".addData() and .addRow()", () => {
	let oldData = stats.data,
		newData = [ { a: 4, b: 23 }, { a: 7, b: 12 }, { a: 2, b: 17 } ],
		newRow = { a: 29, b: 7 },
		newLength = oldData.length + newData.length + 1;

	it("should return true on success", () => {
		assert.deepEqual(stats.addData(newData), true);
		assert.deepEqual(stats.addRow(newRow), true);
	});

	it("should add data as last row(s)", () => {
		assert.deepEqual(stats.data[newLength - 1], newRow);
		assert.deepEqual(stats.data.slice(-newData.length - 1), newData.concat([newRow]));
	});

	it("should keep old data untouched", () => {
		assert.deepEqual(stats.data.slice(0, oldData.length), oldData);
	});

	it("should add the right amount of datasets", () => {
		assert.equal(stats.data.length, newLength);
	});

	it("should return undefined if no data is given", () => {
		assert.equal(stats.addData(), undefined);
		assert.equal(stats.addRow(), undefined);
	});
});


/********************************
	Remove row
 ********************************/

describe(".removeRow()", () => {
	let oldData, oldLength;

	it("should return true on success", () => {
		oldData = stats.data;
		oldLength = oldData.length;

		assert.equal(stats.removeRow(0), true);
	});

	it("should remove only one row", () => {
		assert.equal(stats.data.length, oldLength - 1);
	});

	it("should return undefined if index is too large", () => {
		assert.equal(stats.removeRow(oldLength + 10), undefined);
	});

	it("should return undefined if no index is given", () => {
		assert.equal(stats.removeRow(), undefined);
	});
});


/********************************
	Reset
 ********************************/

describe(".reset()", () => {
	let columns = stats.columns,
		valueMaps = stats.valueMaps;

	it("should return true in success", () => {
		assert.equal(stats.reset(), true);
	});

	it("should return undefined for all data-related variables", () => {
		assert.equal(stats.data, undefined);
		assert.equal(stats.storedResults, undefined);
	});

	it("should keep columns, value maps and options intact", () => {
		assert.equal(stats.columns, columns);
		assert.equal(stats.valueMaps, valueMaps);
		assert.equal(stats.suppressWarnings, true);
	});

});


/********************************
	Contingency table
 ********************************/

describe(".contingencyTable()", () => {
	let example1Values = Array(43).fill({ hand: 'right', gender: 'male' })
				 .concat(Array(44).fill({ hand: 'right', gender: 'female' }))
				 .concat(Array(9).fill({ hand: 'left', gender: 'male' }))
				 .concat(Array(4).fill({ hand: 'left', gender: 'female' })),
		example1Vars = { hand: { scale: 'nominal', valueMap: ['right', 'left'] }, gender: { scale: 'nominal', valueMap: ['male', 'female'] } },
		example2Values = Array(4).fill({ likert: 0, gender: 'male' })
				 .concat(Array(7).fill({ likert: 1, gender: 'male' }))
				 .concat(Array(2).fill({ likert: 2, gender: 'male' }))
				 .concat(Array(3).fill({ likert: 0, gender: 'female' }))
				 .concat(Array(9).fill({ likert: 1, gender: 'female' }))
				 .concat(Array(12).fill({ likert: 2, gender: 'female' })),
		example2Vars = { likert: { scale: 'ordinal', valueMap: [0, 1, 2] }, gender: { scale: 'nominal', valueMap: ['male', 'female'] } },
		stats1 = new Statistics(example1Values, example1Vars, options),
		stats2 = new Statistics(example2Values, example2Vars, options),
		result1 = stats1.contingencyTable('hand', 'gender'),
		result2 = stats2.contingencyTable('gender', 'likert');

	it("should return correct values", () => {
		assert.equal(result1.detailled.right.male, 43);
		assert.equal(result1.detailled.right.female, 44);
		assert.equal(result1.detailled.left.male, 9);
		assert.equal(result1.detailled.left.female, 4);
		assert.equal(result1.detailled.total.total, 100);
		assert.equal(result1.detailled.total.male, 52);
		assert.equal(result1.detailled.total.female, 48);
		assert.equal(result1.detailled.total.right, 87);
		assert.equal(result1.detailled.total.left, 13);

		assert.equal(result2.detailled.male[0], 4);
		assert.equal(result2.detailled.male[1], 7);
		assert.equal(result2.detailled.male[2], 2);
		assert.equal(result2.detailled.female[0], 3);
		assert.equal(result2.detailled.female[1], 9);
		assert.equal(result2.detailled.female[2], 12);
		assert.equal(result2.detailled.total.male, 13);
		assert.equal(result2.detailled.total.female, 24);
		assert.equal(result2.detailled.total.total, 37);
	});

	it("should return a, b, c and d for 2x2 tables", () => {
		assert.equal(result1.a, 43);
		assert.equal(result1.b, 44);
		assert.equal(result1.c, 9);
		assert.equal(result1.d, 4);
		assert.equal(result2.a, undefined);
	});

	it("should return undefined if only one or no columns are given", () => {
		assert.equal(stats1.contingencyTable('abc'), undefined);
		assert.equal(stats1.contingencyTable(), undefined);
	});
});



/********************************
	Assign ranks
 ********************************/

describe(".assignRanks()", () => {
	let example1Values = [
			{ age: 22, iq: 110 },
			{ age: 26, iq: 107 },
			{ age: 43, iq: 85 },
			{ age: 37, iq: 99 },
			{ age: 26, iq: 104 },
			{ age: 22, iq: 103 },
			{ age: 29, iq: 106 },
			{ age: 26, iq: 102 },
			{ age: 35, iq: 102 },
			{ age: 38, iq: 96 }
		],
		example1Vars = { iq: 'metric', age: 'metric' },
		stats1 = new Statistics(example1Values, example1Vars, options),
		result1 = stats1.assignRanks('age'),
		result2 = stats1.assignRanks('age', { order: 'desc', returnFrequencies: true });

	it("should rank correctly", () => {
		assert.equal(result1[2]['age'], 26);
		assert.equal(result1[9]['age'], 43);

		assert.equal(result2.data[1]['age'], 38);
		assert.equal(result2.data[8]['age'], 22);
	});

	it("should return frequencies if asked", () => {
		assert.equal(result2.frequencies['22'], 2);
		assert.equal(result2.frequencies['43'], 1);
	});

	it("should return undefined if no column is given", () => {
		assert.equal(stats1.assignRanks(), undefined);
	});
});