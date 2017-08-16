'use strict';

/**
	See the documentation for information about usage,
	license and disclaimer.
**/

var Statistics = function(data, columns, options = {}) {
/**
	Initialize Class with data to be imported and, optional, with table of variables.
	Data format should be an array of objects with each object as one dataset or
	a JSON formatted string that resolves to such data format.
**/

	this.data = undefined;
	this.columns = undefined;
	this.valueMaps = undefined;
	this.storedResults = undefined;
	this.lastUpdated = undefined;
	this.validScales = ['nominal', 'ordinal', 'interval', 'metric'];	// Needs to be ordered by level of sophistication, in ascending order.
	this.zTable = undefined;
	this.factorials = [ 1, 1, 2, 6, 24, 120, 720, 5040, 40320, 362880,
						3628800, 39916800, 479001600, 6227020800, 87178291200, 1307674368000, 20922789888000, 355687428096000, 6402373705728000, 121645100408832000,
						2432902008176640000, 5109094217170944000];

	this.defaultOptions = {
		epsilon: 0.00001,
		excludeColumns: ['ID', 'id'],
		incompleteBetaIterations: 40,
		incompleteGammaIterations: 80,
		maxBarnardsN: 200,
		spougeConstant: 40,
		suppressWarnings: false,
		zTableIterations: 25
	};

	this.init = function(data, columns, options = {}) {
		if (typeof data === 'undefined') this.errorMessage('No data was supplied.');

		for (var option in this.defaultOptions) {
			var newValue = (typeof options === 'object' && this.has(options, option) && this.has(this.defaultOptions, option)) ? options[option] : this.defaultOptions[option];
			Object.defineProperty(this, option, {
				value: newValue,
				writable: false
			});
		}

		if (typeof data !== 'undefined') this.updateData(data, columns);
		return this;
	}

	/**
		Import data from variable dataInput and assign a variable table 'columns' (optional).
	**/

	this.updateData = function(dataInput, columns) {
		this.addData(dataInput);

		if (typeof columns === 'object')
			this.assignValueMap(columns);

		if (dataInput.constructor === Array && typeof columns !== 'object') {
			this.errorMessage('It is strongly encouraged to initalise statistics.js with a variable table that defines the scale of measurement of each variable (e.g. nominal, metric.). All variables will be assumed as nominal and subsequent analyses will likely be flawed.');
			defineColumns.apply(this);
		}
	}


	/**
		Add data to existing data
	**/

	this.addData = function(dataInput) {
		try {
			let type = typeof dataInput;
			if (!(type === 'string' || type === 'object') || dataInput === null)
				throw 'Input variable data is neither an object nor a JSON encoded string. The variable type is ' + type + '. The data could not be properly imported.';

			if (type === 'string')
				dataInput = JSON.parse(dataInput);

			this.data = (!this.data) ? dataInput : this.data.concat(dataInput);
			this.lastUpdated = Date.now();
			return true;
		} catch (error) {
			return this.errorMessage(error);
		}
	}


	/**
		Add row of values to existing data
	**/

	this.addRow = function(dataset) {
		if (typeof dataset === 'undefined') return this.errorMessage('Add Row: No data was given.');

		let data = (typeof this.data !== 'undefined') ? this.data : [];
		data.push(dataset);
		this.data = data;
		this.lastUpdated = Date.now();

		return true;
	};


	/**
		Remove row of values
	**/

	this.removeRow = function(index, useID = false) {
		if (typeof index === 'undefined') return this.errorMessage('Remove row: No index was given.');

		let data = this.data,
			idcolumn = this.has(this.columns, 'id') || this.has(this.columns, 'ID');

		if (useID && idcolumn) {
			let dataIndex = -1,
				i = 0;

			while (dataIndex === -1 && i < data.length) {
				if ((this.has(data[i], 'id') && data[i].id === useID) || (this.has(data[i], 'ID') && data[i].ID === useID)) dataIndex = i;
			}

			data.splice(i, 1);

		} else {
			if (useID && !idcolumn) this.errorMessage('Remove row: There is no column "id" or "ID". The index ' + index + ' will be treated as the number of the row, starting at 0.');
			if (index > data.length - 1) return this.errorMessage('Remove row: The stored data has only ' + data.length + ' rows and index ' + index + ' is too large. Indexes start at 0.')

			data.splice(index, 1);
		}

		this.data = data;
		this.lastUpdated = Date.now();

		return true;
	};



	/**
		Delete all data and stored results, but leave columns, value maps and settings intact.
	**/

	this.reset = function() {
		try {
			this.data = undefined;
			this.storedResults = undefined;
			this.lastUpdated = Date.now();
			return true;
		} catch (e) {
			this.errorMessage(e.message);
		}
	}


	/**
		Read variable table to assign scale of measurement to each data column
	**/

	this.assignValueMap = function(variables) {
		let columns = {},
			valueMaps = {};

		for (var key in variables) {
			if (!this.has(variables, key) || this.excludeColumns.indexOf(key) > -1) continue;

			let column = variables[key],
				scale = column,
				valueMap = undefined;

			if (typeof column === 'object') {
				if (this.has(column, 'scale')) {
					if (this.has(column, 'valueMap')) valueMap = column.valueMap;
					scale = column.scale;
				}
			}

			if (typeof valueMap === 'undefined' && (scale === 'nominal' || scale === 'ordinal'))
				valueMap = this.getUniqueValues(this.data.map(row => { return row[key]; }));

			if (typeof valueMap !== 'undefined')
				valueMaps[key] = valueMap;

			if (this.validScales.indexOf(scale) > -1) {
				columns[key] = scale;
			} else {
				columns[key] = 'nominal';
				let error = '"' + scale + '" scale for variable "' + key + '" is invalid. It was assumed as nominal. Valid scales of measurement include: ' + this.validScales.join(', ');
				this.errorMessage(error);
			}
		}

		this.columns = columns;
		this.valueMaps = valueMaps;
		this.sanitizeColumns();
	}


	var defineColumns = function() {		// private function
		let columns = {},
			s = ['th', 'st', 'nd', 'rd'];
		for (var i = 0; i < this.data.length; i++) {
			if (typeof this.data[i] !== 'object') {
				let	v = i % 100,
					ord = i + (s[(v - 20) % 10] || s[v] || s[0]);
				this.errorMessage('The ' + ord + ' row was ignored because it is not an object.');
			} else {
				for (var key in Object.keys(this.data[i])) {
					if (!key in columns) columns[key] = 'nominal';
				}		
			}
		}
			
		this.columns = columns;
		this.lastUpdated = Date.now();
	}


	/**
		Sanitize data for columns according to their scale of measurement
	**/

	this.sanitizeColumns = function() {
		let columns = this.columns,
			values = this.data;

		for (var i = 0; i < values.length; i++) {
			let row = values[i];

			for (var column in columns) {
				let value = row[column],
					newValue = value;
				switch (columns[column]) {
					case 'metric':
						newValue = (this.isNumeric(value)) ? value : NaN;
						break;
					case 'interval':
						newValue = (this.isNumeric(value)) ? value : NaN;
						break;
					case 'ordinal':
						if (typeof this.valueMaps !== 'undefined') {
							let map = this.valueMaps[column];
							if (typeof map !== 'undefined') newValue = map.indexOf(value);
						}
						break;
					default:
						break;
				}

				values[i][column] = newValue;
			}
		}

		this.data = values;
		this.lastUpdated = Date.now();
	}


	this.setScale = function(column, scale) {
		if (typeof scale === 'undefined') {
			this.errorMessage('This method needs to be called with valid values for both the variable and the scale of measurement to set.');
			return false;
		} else if (!this.has(this.columns, column)) {
			this.errorMessage('There is no variable "' + column + '" defined.');
			return false;
		} else if (this.validScales.indexOf(scale) === -1) {
			this.errorMessage('"' + scale + '" is not a valid scale of measurement. Valid scales include: ' + this.validScales.join(', '));
			return false;
		} else {
			this.columns[column] = scale;
			return true;
		}
	}

	this.getScale = function(column) {
		if (typeof column !== 'undefined' && this.has(this.columns, column)) return this.columns[column];
	}


	/**
		Get value map for a column
	**/

	this.getValueMap = function(column) {
		if (typeof column !== 'undefined' && this.has(this.columns, column)) return this.valueMaps[column];
	}

	this.applyValueMap = function(column, values) {
		let map = this.getValueMap(column);
		if (this.getScale(column) !== 'ordinal' || typeof map === 'undefined') return;
		if (values === 'undefined') values = this.getColumn(column);
		
		return values.map(old => { return map[old]; });
	}



	/**
		Check when data for a column's paramater was last updated.
		This allows to read already computed value from memory instead of
		recalculating them.
		Returns true if value for a column's parameter is older than last data update.
	**/

	this.checkLastUpdated = function(column, parameter) {
		if (column === '' || !this.has(this.columns, column) || typeof column === 'undefined' ||
			typeof parameter === 'undefined') return false;

		if (typeof this.storedResults === 'undefined' || typeof this.storedResults[column] === 'undefined' ||
			typeof this.storedResults[column][parameter] === 'undefined' ||
			typeof this.storedResults[column][parameter].lastUpdated === 'undefined') return true;

		return this.storedResults[column][parameter].lastUpdated < this.lastUpdated;
	}


	/**
		Update value for a parameter of a column
	**/

	this.updateStatistics = function(column, parameter, value) {
		if (typeof column !== 'undefined' && typeof parameter !== 'undefined' && typeof value !== 'undefined') {
			var obj = {value: value, lastUpdated: Date.now()};

			if (typeof this.storedResults === 'undefined') this.storedResults = { column: { parameter: obj } };
			else if (typeof this.storedResults[column] === 'undefined') this.storedResults[column] = { parameter: obj };
			else this.storedResults[column][parameter] = obj;
		}
	}


	/**
		Get value of a parameter for a column.
		Returns false if parameter was not already calculated.
	**/

	this.getStatistics = function(column, parameter) {
		if (typeof column === 'undefined' || typeof parameter === 'undefined' ||
			!this.has(this.columns, column) || typeof this.storedResults[column][parameter].value === 'undefined') return;
		return this.storedResults[column][parameter].value;
	}



	/********* Utility functions *********/

	this.getColumn = function(column) {
		if (typeof column === 'undefined') return this.errorMessage('Get column: No column to sort was specified.');
		if (!this.has(this.columns, column)) return this.errorMessage('Get column: The column "' + column + '" was not found.');

		return this.data.map(row => { return row[column]; });
	}

	this.sortColumn = function(column, order = 'asc') {
		if (typeof column === 'undefined') return this.errorMessage('Sort column: No column to sort was specified.');
		if (!this.has(this.columns, column)) return this.errorMessage('Sort column: The column "' + column + '" was not found.');

		return this.sort(this.getColumn(column), order);
	}

	this.sortDataByColumn = function(column, {
		data: data = this.data,
		order: order = 'asc',
		changeOriginal: changeOriginal = false
	} = {}) {

		if (data === this.data && (typeof column === 'undefined' || !this.has(this.columns, column))) return this.errorMessage('Sort data by column: No column was specified or this column does not exist.');
		if (data !== this.data && !this.has(data[0], column)) return this.errorMessage('Sort data by column: The column "' + column + '" does not exist.');

		return (function(column, values, order, library) {
				return values.sort(function(a, b) {
					if (library.isNumeric(a[column]) && library.isNumeric(b[column]))
						return (order === 'asc' ? 1 : -1) * (a[column] - b[column]);
					return 0;
				});
		})(column, (changeOriginal ? data : this.deepCopy(data)), order, this);
	}

	this.sort = function(values, order = 'asc') {
		if (typeof values === 'undefined') return this.errorMessage('Sort: No values given.');
		if (values.constructor !== Array || values.length === 0) return this.errorMessage('Sort: No array or an empty array of values was given.');

		return (function(data, library, order) {
				return data.sort((a, b) => {
					if (library.isNumeric(a) && library.isNumeric(b))
						return (order === 'asc' ? 1 : -1) * (a - b);
					return 0;
				});
		})(this.deepCopy(values), this, order);
	}


	this.getUniqueValues = function(data) {
		if (typeof data === 'undefined') return this.errorMessage('Get unique values: No values given.');
		let validated = this.validateInput(data, 'nominal', 'get unique values');
		if (validated === false) return;

		return this.sort(validated.data.filter((value, index) => { return validated.data.indexOf(value) === index; }));
	}


	this.reduceToPairs = function(firstColumn, secondColumn) {
		if (typeof secondColumn === 'undefined' || typeof firstColumn === 'undefined') return this.errorMessage('This method requires two variables to be compared.');

		let validatedFirst = this.validateInput(firstColumn, 'nominal');
		if (validatedFirst === false) return;
		let validatedSecond = this.validateInput(secondColumn, 'nominal');
		if (validatedSecond === false) return;

		let len = (validatedFirst.length >= validatedSecond.length) ? validatedFirst.length : validatedSecond.length,
			valuesFirst = [],
			valuesSecond = [],
			valuesCombined = [];

		let firstName = (typeof firstColumn === 'string') ? firstColumn : 'first',
			secondName = (typeof secondColumn === 'string') ? secondColumn : 'second';

		for (var i = 0; i < len; i++) {
			let valF = validatedFirst.data[i],
				valS = validatedSecond.data[i];

			if (typeof valF !== undefined && typeof valS !== undefined && !isNaN(valF) && !isNaN(valS)) {
				valuesFirst.push(valF);
				valuesSecond.push(valS);
				let row = {};
				row[firstName] = valF;
				row[secondName] = valS;
				valuesCombined.push(row);
			}
		}

		return {
			length: valuesFirst.length,
			missings: len - valuesFirst.length,
			valuesFirst: valuesFirst,
			valuesSecond: valuesSecond,
			valuesCombined: valuesCombined
		}
	}


	/**
		Validate input data and return false if test is not passed
		or object containing the values, the scale and number of values for the given data
	**/

	this.validateInput = function(input, minimumScale = 'metric', test = '') {
		let result = {};
		if (typeof input !== 'string' && (input.constructor !== Array || (input.constructor === Array && input.length == 0))) {
			this.errorMessage('No properly formatted data was supplied. Specify a column by its name (string) or supply an array of values.');
			return false;
		} else if (typeof input === 'string' && input !== '') {
			result.data = this.getColumn(input);
			result.scale = this.getScale(input);
			result.length = result.data.length;
		} else if (input.constructor === Array && input.length > 0) {
			if (this.validateData(input, minimumScale) === false) return false;
			result.data = input;
			result.scale = minimumScale;
			result.length = result.data.length;
		} else {
			return false;
		}

		if (result.length == 0) {
			this.errorMessage('The supplied data or the data of the supplied column contains no values.');
			return false;
		} else if (!isScaleAtLeast.apply(this, [result.scale, minimumScale])) {
			let scales = this.validScales.slice(this.validScales.indexOf(minimumScale)).join(', '),
				msg = (test !== '') ? test.charAt(0).toUpperCase() + test.slice(1) : 'This statistical method';
			msg += ' is only defined for these scales of measurement: ' + scales + '. The scale of the supplied data is ' + result.scale + '.';
			this.errorMessage(msg);
			return false;
		}

		return result;
	}

	this.validateData = function(values, minimumScale = 'metric') {
		if (typeof values === 'undefined' || data.constructor !== Array) return this.errorMessage('Validate data: Specify an array storing the values to be validated.');
		if (minimumScale === 'nominal') return true;
		for (var i = 0; i < values.length; i++) {
			if (!this.isNumeric(values[i])) {
				this.errorMessage('Validate data: The supplied data contains non-numeric values: ' + values[i] + ' at index ' + i);
				return false;
			}
		}

		return true;
	}

	this.isNumeric = function(n) {
		return (typeof n !== 'undefined') ? !Array.isArray(n) && !isNaN(parseFloat(n)) && isFinite(n) : undefined;
	}

	var isScaleAtLeast = function(toTest, minimum) { 		// private function
		return (this.validScales.indexOf(toTest) >= this.validScales.indexOf(minimum));
	}

	this.errorMessage = function(error) {
		if (!this.suppressWarnings) {
			try {
				throw new TypeError((typeof error == 'string') ? error : error.message);
			} catch (e) {
				console.error('statistics.js: ' + e.message);	
			}
		}
	}

	// protects from null objects and overridden .hasOwnProperty method
	this.has = function(obj, key) {
		var lookup = Object.prototype.hasOwnProperty;
		return lookup.call(obj, key);
	}

	this.deepCopy = function(obj) {
		let output = Array.isArray(obj) ? [] : {};
		for (let key in obj) {
			let value = obj[key];
			output[key] = (typeof value === "object") ? this.deepCopy(value) : value;
		}
		return output;
	}

	/********* Assign ranks *********/

	Statistics.prototype.assignRanks = function(column, {
		data: data = this.data,
		order: order = 'asc',
		handleTiedValues: handleTiedValues = 'mean',
		returnFrequencies: returnFrequencies = false
	} = {}) {

		if (typeof column === 'undefined') return this.errorMessage('Assign ranks: You need to specify a column to be ranked.');
		let ranked = this.deepCopy(this.sortDataByColumn(column, { data: data, order, changeOriginal: false }));

		let counts = {};
		for (var i = 0; i < ranked.length; i++) {
			let value = ranked[i][column];
			counts[value] = counts[value] ? counts[value] + 1 : 1;
		}

		let ranks = {},
			currentCount = 0,
			tiedRanks = [];

		// rank values
		for (var i = 0; i < ranked.length; i++) {
			let value = ranked[i][column],
				rank = i + 1,
				key = 'rank-' + column;

			if (counts[value] === 1) {
				currentCount = 0;
			} else {
				// form midvalues if multiple values were detected
				if (handleTiedValues === 'mean') {
					currentCount++;
					rank = i + counts[value] / 2 - currentCount + 1.5;
				// assign random ranks if multiple values were detected
				} else if (handleTiedValues === 'random') {
					if (tiedRanks.length === 0) {
						tiedRanks = Array.from(new Array(counts[value]), (val, index) => index + i + 1);
					}

					rank = tiedRanks[Math.floor(Math.random() * tiedRanks.length)];
					tiedRanks.splice(tiedRanks.indexOf(rank), 1);
				}
			}

			if (currentCount == counts[value]) currentCount = 0;
			ranked[i][key] = rank;
		}

		return (returnFrequencies) ? { data: ranked, frequencies: counts } : ranked;
	}


	/********* Contingency Table *********/

	Statistics.prototype.contingencyTable = function(firstColumn, secondColumn) {
		if (typeof secondColumn === 'undefined') return this.errorMessage('A contingency table requires two columns to analyze.');
		if (!this.has(this.columns, firstColumn)) return this.errorMessage('There is no variable "' + firstColumn + '" defined.');
		if (!this.has(this.columns, secondColumn)) return this.errorMessage('There is no variable "' + secondColumn + '" defined.');

		let firstScale = this.getScale(firstColumn),
			secondScale = this.getScale(secondColumn);

		if (!(firstScale === 'nominal' || firstScale === 'ordinal') || !(secondScale === 'nominal' || secondScale === 'ordinal'))
			return this.errorMessage('Both variables need to be nominal for. They are ' + firstScale + ' and ' + secondScale + '.');

		let keysFirst = this.getValueMap(firstColumn),
			keysSecond = this.getValueMap(secondColumn);

		if (typeof keysFirst === 'undefined' || typeof keysSecond === 'undefined') return this.errorMessage('Contingency table: There are no valid values.');

		let table = {total: {total: 0}},
			data = this.data;

		for (var i = 0; i < data.length; i++) {
			let firstVar = data[i][firstColumn],
				secondVar = data[i][secondColumn];

			if (typeof table[firstVar] === 'undefined')
				table[firstVar] = {total: 0};

			table[firstVar][secondVar] = (typeof table[firstVar][secondVar] !== 'undefined') ? table[firstVar][secondVar] + 1 : 1;
			table['total'][firstVar]  = (typeof table['total'][firstVar]  !== 'undefined') ? table['total'][firstVar]  + 1 : 1;
			table['total'][secondVar]  = (typeof table['total'][secondVar]  !== 'undefined') ? table['total'][secondVar]  + 1 : 1;
			table[firstVar]['total']++;
			table['total']['total']++;
		}

		let result = { detailled: table };
		if (keysFirst.length <= 2 && keysSecond.length <= 2) {
			result.a = table[keysFirst[0]][keysSecond[0]] || 0;
			result.b = table[keysFirst[0]][keysSecond[1]] || 0;
			result.c = table[keysFirst[1]][keysSecond[0]] || 0;
			result.d = table[keysFirst[1]][keysSecond[1]] || 0;
		}

		return result;
	}

	this.showData = function(input) {
		if (typeof input === 'string' && this.has(this.columns, input)) {
			if (this.getScale(input) === 'ordinal')
				console.log(this.applyValueMap(input));
			else
				console.log(this.getColumn(input));
		} else if (typeof input === 'undefined') {
			let maps = this.valueMaps,
				data = this.data;

			if (typeof maps !== 'undefined') {
				for (var map in maps) {
					if (this.has(maps, map) && typeof maps[map] !== 'undefined' && this.getScale(map) === 'ordinal') {
						for (var i = 0; i < data.length; i++) {
							data[i][map] = maps[map][data[i][map]];
						}
					}
				}
			}

			console.table(data);
		} else {
			console.log(input);
		}
	}

	this.scatterPlot = function(data = this.data, {
		canvas: canvas = null,
		xAxis: xAxis = null,
		yAxis: yAxis = null,
		width: width = null,
		height: height = null,
		dotRadius: dotRadius = 4,
		showGrid: showGrid = false,
		minNumberXMarks: minNumberXMarks = 8,
		minNumberYMarks: minNumberYMarks = 8,
		background: background = '#FFFFFF',
		dotColor: dotColor = '#000000',
		gridColor: gridColor = '#CCCCCC',
		axisColor: axisColor = '#000000'
	} = {}) {
		if (typeof data === 'undefined') return this.errorMessage('Scatter plot: No data given.');
		if (data.constructor !== Array || data.length === 0) return this.errorMessage('Scotter plot: Data is not an array or empty.');
		if (minNumberXMarks <= 0 || minNumberYMarks <= 0) return this.errorMessage('Scotter plot: The number of line to plot must be larger than 0.');

		let type = typeof data[0];

		if (type === 'object' && (!xAxis || !yAxis)) return this.errorMessage('Scatter plot: The variables for the x and y axes need to be supplied.');

		let values = {},
			minX = Infinity,
			maxX = -Infinity,
			minY = Infinity,
			maxY = -Infinity,
			uniqueX = 0;

		// construct object with all x-values as keys and array of all associated y values as their value
		for (var i = 0; i < data.length; i++) {
			let xCollection = [],
				xValue, yValue;

			if (type === 'number' || data[0].constructor === Array) {
				if (!this.isNumeric(data[i])) continue;
				xValue = i;
				yValue = data[i];
			} else if (type === 'object') {
				if (!this.has(data[i], xAxis) || !this.has(data[i], yAxis) || !this.isNumeric(data[i][xAxis]) || !this.isNumeric(data[i][yAxis])) continue;
				xValue = data[i][xAxis],
				yValue = data[i][yAxis];
			}

			if (this.has(values, xValue))
				xCollection = values[xValue];
			else
				uniqueX += 1;

			xCollection.push(yValue)
			values[xValue] = xCollection;

			if (xValue > maxX) maxX = xValue;
			if (xValue < minX) minX = xValue;
			if (yValue > maxY) maxY = yValue;
			if (yValue < minY) minY = yValue;
		}

		if (minX / maxX < 0.1) minX = 0;
		if (minY / maxY < 0.1) minY = 0;

		// set up canvas
		if (canvas === null) canvas = document.createElement('canvas');
		let ctx = canvas.getContext('2d'),
			border = (!width) ? 0.1 * (maxX - minX) : 0.1 * width;

		width = ((!width) ? maxX - minX : width - 2 * border) + 2 * dotRadius,
		height = ((!height) ? maxY - minY : height - 2 * border) + 2 * dotRadius;

		if (width < 400) width = 400;
		if (height < 400) height = 400;
		if (border < 40) border = 40;

		canvas.width = width;
		canvas.height = height;
		ctx.fillStyle = 'transparent';
		ctx.fillRect(0, 0, width, height);
		ctx.fillStyle = dotColor;

		// draw points
		for (var x in values) {
			for (var y = 0; y < values[x].length; y++) {
				let xCoord = (x - minX) * (width - dotRadius) / (maxX - minX),
					yCoord = height - (values[x][y] - minY) * (height - dotRadius) / (maxY - minY) - dotRadius;
				ctx.fillRect(xCoord, yCoord, dotRadius, dotRadius);
			}
		}

		// draw line helper function
		const drawLine = function(ctx, x1, y1, x2, y2, fill = axisColor) {
			ctx.strokeStyle = fill;
			ctx.beginPath();
			ctx.moveTo(Math.floor(x1), Math.floor(y1));
			ctx.lineTo(Math.floor(x2), Math.floor(y2));
			ctx.stroke();
			ctx.strokeStyle = axisColor;
		}

		// draw new canvas with UI
		let canvasUI = document.createElement('canvas'),
			ctxUI = canvasUI.getContext('2d'),
			widthUI = width + 2 * border - 2 * dotRadius,
			heightUI = height + 2 * border - 2 * dotRadius;

		canvasUI.width = widthUI;
		canvasUI.height = heightUI;
		ctxUI.fillStyle = background;
		ctxUI.fillRect(0, 0, widthUI, heightUI);
		ctxUI.fillStyle = axisColor;
		ctxUI.font = 0.2 * border + "px Arial";
		ctxUI.textAlign = 'center';
		ctxUI.textBaseline = 'middle';

		// draw x-axis grid and labels
		let xStep = Math.round((maxX - minX) / minNumberXMarks);
		let	magnitudeX = (xStep >= 1) ? Math.pow(10, parseInt(xStep).toString().length - 1) : Math.pow(10, -2);
		xStep = Math.round(xStep / magnitudeX) * magnitudeX;

		let n = 0,
			xCoord = 0,
			yCoord = 0;

		if (xStep > 0) {
			for (var i = 0; i < minNumberXMarks || n <= maxX && xCoord <= width - 2 * border; i++) {
				n = Math.round(minX / magnitudeX) * magnitudeX + i * xStep;
				xCoord = 0.5 * border + (n - minX) * (width - dotRadius) / (maxX - minX);

				if (xCoord > widthUI - 0.5 * border || xCoord < 0.5 * border) continue;

				drawLine(ctxUI, xCoord, heightUI - 0.4 * border, xCoord, heightUI - 0.6 * border);
				if (showGrid)
					drawLine(ctxUI, xCoord, heightUI - 0.6 * border, xCoord, 0.5 * border, gridColor);
				ctxUI.fillText(n, xCoord, heightUI - 0.2 * border);
			}
		}

		// draw y-axis grid and labels
		let yStep = (maxY - minY) / minNumberYMarks,
			magnitudeY = (yStep >= 1) ? Math.pow(10, parseInt(yStep).toString().length - 1) : Math.pow(10, -2);
		yStep = Math.round(yStep / magnitudeY) * magnitudeY;
		n = 0;

		if (yStep > 0) {
			for (var i = 0; i < minNumberYMarks || n <= maxY && yCoord <= height - 2 * border; i++) {
				n = Math.round(minY / magnitudeY) * magnitudeY + i * yStep;
				yCoord = 1.5 * border - 2 * dotRadius + height - (n - minY) * (height - dotRadius) / (maxY - minY);

				if (yCoord > heightUI - 0.5 * border || yCoord < 0.5 * border) continue;

				drawLine(ctxUI, 0.4 * border, yCoord, 0.6 * border, yCoord);
				if (showGrid)
					drawLine(ctxUI, 0.6 * border, yCoord, width + border - 2 * dotRadius, yCoord, gridColor);
				ctxUI.fillText(n, 0.2 * border, yCoord);
			}
		}

		// draw x- and y-axis
		drawLine(ctxUI, 0.5 * border, heightUI - 0.5 * border, widthUI - border, heightUI - 0.5 * border);
		drawLine(ctxUI, 0.5 * border, heightUI - 0.5 * border, 0.5 * border, 0.5 * border);

		// copy plot on UI canvas and replace original canvas
		ctxUI.drawImage(canvas, 0.5 * border - 0.5 * dotRadius, 1.5 * border - 1.5 * dotRadius);
		ctx.drawImage(canvasUI, 0, 0, width, height);

		return canvas;
	}

	return this.init(data, columns, options);
}

if (typeof exports !== 'undefined') {
	if (typeof module !== 'undefined' && module.exports)
		exports = module.exports = Statistics;
	exports.Statistics = Statistics;
} else {
	window.Statistics = Statistics;
}