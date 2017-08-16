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
Statistics.prototype.mean = function(data) { return (typeof data !== 'undefined') ? this.arithmeticMean(data) : undefined; }
Statistics.prototype.arithmeticMean = function(data) {
	if (typeof data === 'undefined') return this.errorMessage('Arithmetic mean: No data was supplied.');
	if (typeof data === 'string' && this.checkLastUpdated(data, 'mean') === false) return this.getStatistics(data, 'mean');
	let validated = this.validateInput(data, 'interval', 'arithmetic mean');
	if (validated === false) return;

	let mean = this.sumExact(validated.data) / validated.length;
	if (typeof data === 'string') this.updateStatistics(data, 'mean', mean);
	return mean;
}

Statistics.prototype.geometricMean = function(data) {
	if (typeof data === 'undefined') return this.errorMessage('Geometric mean: No data was supplied.');
	if (typeof data === 'string' && this.checkLastUpdated(data, 'geometricMean') === false) return this.getStatistics(data, 'geometricMean');
	let validated = this.validateInput(data, 'metric', 'geometric mean');
	if (validated === false) return;

	let mean = undefined,
		error = false;

	mean = validated.data.reduce((a, b) => {
		if (b > 0) {
			return a * b;
		} else {
			error = true;
			return a;
		}
	}, 1);

	if (!error && validated.length > 0) {
		mean = Math.pow(mean, 1 / validated.length);
	} else {
		this.errorMessage('Geometric mean is not defined because the data contains non-positive values.');
		mean = undefined;
	}

	if (typeof data === 'string') this.updateStatistics(data, 'geometricMean', mean);
	return mean;
}

Statistics.prototype.harmonicMean = function(data) {
	if (typeof data === 'undefined') return this.errorMessage('Harmonic mean: No data was supplied.');
	if (typeof data === 'string' && this.checkLastUpdated(data, 'harmonicMean') === false) return this.getStatistics(data, 'harmonicMean');
	let validated = this.validateInput(data, 'metric', 'harmonicMean');
	if (validated === false) return;

	let isNull = false,
		error = false,
		mean = validated.data.reduce((a, b) => {
			if (b < 0) { 
				error = true;
				return 0;
			} else if (b !== 0) {
				return a + 1 / b;
			} else {
				isNull = true;
				return 0;
			}
		}, 0);

	mean = (isNull) ? 0 : validated.length / mean;
	mean = (error) ? undefined : mean;

	if (typeof data === 'string') this.updateStatistics(data, 'harmonicMean', mean);
	return mean;
}

Statistics.prototype.rootMeanSquare = function(data) {
	if (typeof data === 'undefined') return this.errorMessage('Root mean square: No data was supplied.');
	if (typeof data === 'string' && this.checkLastUpdated(data, 'rootMeanSquare') === false) return this.getStatistics(data, 'rootMeanSquare');
	let validated = this.validateInput(data, 'interval', 'root mean square');
	if (validated === false) return;

	let mean = Math.sqrt(validated.data.reduce((a, b) => { return a + b * b; }, 0) / validated.length);

	if (typeof data === 'string') this.updateStatistics(data, 'rootMeanSquare', mean);
	return mean;
}

Statistics.prototype.cubicMean = function(data) {
	if (typeof data === 'undefined') return this.errorMessage('Cubic mean: No data was supplied.');
	if (typeof data === 'string' && this.checkLastUpdated(data, 'cubicMean') === false) return this.getStatistics(data, 'cubicMean');
	let validated = this.validateInput(data, 'interval', 'cubic mean');
	if (validated === false) return;

	let mean = validated.data.reduce((a, b) => { return a + b * b * b; }, 0);
	mean = (mean >= 0 && validated.length > 0) ? Math.pow(mean / validated.length, 1/3) : undefined; 

	if (typeof data === 'string') this.updateStatistics(data, 'cubicMean', mean);
	return mean;
}


/**
	Winsorised (truncated) mean to discard outliers. Specify a percentage in the range [0, 0.5]
	of values to be cut off of either end of the distribution.
**/

Statistics.prototype.winsorisedMean = function(data, percentage = 0.2) {
	if (typeof data === 'undefined') return this.errorMessage('Winsorised mean: No data was supplied.');
	if (percentage < 0 || percentage > 0.5) return this.errorMessage('winsorisedMean should be called with a percentage value within the range of [0, 0.5].');
	if (percentage === 0.5) return this.median(data);

	let validated = this.validateInput(data, 'interval', 'Winsorised (truncated) mean');
	if (validated === false) return;

	let cutoff = Math.floor(validated.length * percentage),
		values = this.sort(validated.data).slice(cutoff, validated.length - cutoff);

	values = Array(cutoff).fill(values[0]).concat(values).concat(Array(cutoff).fill(values[values.length - 1]));
	let	mean = this.sumExact(values) / (validated.length);

	return mean;
}


/**
	Gastwirth-Cohen Mean is defined as the weighted mean of three quantils:
	the lambda-weighted (alpha)quantil and (1 - alpha)quantil and
	the (1 - 2*lambda)-weighted median
	alpha and lambda must be within the range of [0, 0.5]
**/

Statistics.prototype.gastwirthCohenMean = function(data, { alpha: alpha = 0.25, lambda: lambda = 0.25 } = {}) {
	if (typeof data === 'undefined') return this.errorMessage('Gastwirth-Cohen mean: No data was supplied.');
	let validated = this.validateInput(data, 'ordinal', 'Gastwirth-Cohen Mean');
	if (validated === false) return;

	if (!this.isNumeric(alpha) || alpha < 0 || alpha > 0.5) return this.errorMessage('Gastwirth-Cohen mean should be called with an alpha value within the range of [0, 0.5].');
	if (!this.isNumeric(lambda) || lambda < 0 || lambda > 0.5) return this.errorMessage('Gastwirth-Cohen mean should be called with a lambda value within the range of [0, 0.5].');

	let lowerQuantil = this.quantile(data, alpha),
		higherQuantil = this.quantile(data, 1 - alpha),
		median = this.median(data),
		mean = undefined;

	if (typeof lowerQuantil !== 'undefined' && typeof higherQuantil !== 'undefined' && typeof median !== 'undefined')
		mean = lambda * (lowerQuantil + higherQuantil) + (1 - 2 * lambda) * median;
	return mean;
}



Statistics.prototype.midRange = function(data) {
	if (typeof data === 'undefined') return this.errorMessage('Mid-range: No data was supplied.');
	let validated = this.validateInput(data, 'interval', 'mid-range');
	if (validated === false) return;

	let min = this.minimum(data),
		max = this.maximum(data);
	return  (typeof min !== 'undefined' && typeof max !== 'undefined') ? 0.5 * (min + max) : undefined;
}


Statistics.prototype.median = function(data) {
	if (typeof data === 'undefined') return this.errorMessage('Median: No data was supplied.');
	if (typeof data === 'string' && this.checkLastUpdated(data, 'median') === false) return this.getStatistics(data, 'median');

	let median = this.quantile(data, 0.5);
	if (typeof data === 'string') this.updateStatistics(data, 'median', median);
	return median;
}


/**
	returns the most frequent value within a dataset
**/

Statistics.prototype.mode = function(data) {
	if (typeof data === 'undefined') return this.errorMessage('Mode: No data was supplied.');
	if (typeof data === 'string' && this.checkLastUpdated(data, 'mode') === false) return this.getStatistics(data, 'mode');
	let validated = this.validateInput(data, 'nominal', 'mode');
	if (validated === false) return;

	let values = validated.data,
		valueList = [],
		maxValues = [values[0]],
		maxCount = 1;

	for (var i = 1; i < validated.length; i++) {
		let value = values[i];
		valueList[value] = (valueList[value] == null) ? 1 : valueList[value] + 1;

		if (valueList[value] > maxCount) {
			maxValues = [value];
			maxCount = valueList[value];
		} else if (valueList[value] === maxCount) {
			maxValues.push(value);
		}
	}

	if (maxValues.length === 1) maxValues = maxValues[0];
	if (typeof data === 'string') this.updateStatistics(data, 'mode', maxValues);
	return maxValues;
}
Statistics.prototype.minimum = function(data) {
	if (typeof data === 'undefined') return this.errorMessage('Minimum: No data was supplied.');
	if (typeof data === 'string' && this.checkLastUpdated(data, 'minimum') === false) return this.getStatistics(data, 'minimum');
	let validated = this.validateInput(data, 'ordinal', 'minimum');
	if (validated === false) return;

	let minimum = Infinity,
		len = validated.length;

	while (len--) {
		if (validated.data[len] < minimum) minimum = validated.data[len];
	}

	if (typeof data === 'string') this.updateStatistics(data, 'minimum', minimum);
	return minimum;
}

Statistics.prototype.maximum = function(data) {
	if (typeof data === 'undefined') return this.errorMessage('Maximum: No data was supplied.');
	if (typeof data === 'string' && this.checkLastUpdated(data, 'maximum') === false) return this.getStatistics(data, 'maximum');
	let validated = this.validateInput(data, 'ordinal', 'maximum');
	if (validated === false) return;

	let maximum = -Infinity,
		len = validated.length;

	while (len--) {
		if (validated.data[len] > maximum) maximum = validated.data[len];
	}

	if (typeof data === 'string') this.updateStatistics(data, 'maximum', maximum);
	return maximum;
}

Statistics.prototype.range = function(data) {
	if (typeof data === 'undefined') return this.errorMessage('Range: No data was supplied.');
	if (typeof data === 'string' && this.checkLastUpdated(data, 'range') === false) return this.getStatistics(data, 'range');

	let validated, range;

	if (typeof data === 'string' && this.getScale(data) === 'nominal') {
		validated = this.validateInput(data, 'nominal', 'range');
		if (validated === false) return;

		range = this.getUniqueValues(validated.data);
	} else {
		validated = this.validateInput(data, 'ordinal', 'range');
		if (validated === false) return;

		let values = this.sort(validated.data);
		range = values[validated.length - 1] - values[0];
	}

	if (typeof data === 'string') this.updateStatistics(data, 'range', range);
	return range;
}

/**
	Calculate variance of a set of data values.
	If dataset is only a sample of a larger population,
	Bessel correction should be applied by setting corrected to true.
	This will make use of Welford's algorithm to calculate exact sample variance.
	Otherwise, pass an integer or float as the true mean of the population.
**/

Statistics.prototype.variance = function(data, corrected = true) {
	if (typeof data === 'undefined') return this.errorMessage('Variance: No data was supplied.');
	if (typeof data === 'string' && this.checkLastUpdated(data, 'variance') === false) return this.getStatistics(data, 'variance');
	let validated = this.validateInput(data, 'interval', 'variance');
	if (validated === false) return;
	if (validated.length < 2) return this.errorMessage('The data supplied to compute variance needs to contain at least two datasets.');

	let variance = 0;

	if (this.isNumeric(corrected)) {
		for (var i = 0; i < validated.length; i++) {
			variance += Math.pow(corrected - validated.data[i], 2);
		}
		variance /= (validated.length - 1);
	} else {
		let n = 0,
			mean = 0;

		for (var i = 0; i < validated.length; i++) {
			n += 1;
			let delta = validated.data[i] - mean;
			mean += delta / n;
			let delta2 = validated.data[i] - mean;
			variance += delta * delta2;
		}

		if (corrected && n > 1) variance /= n - 1;
		else if (!corrected && n > 0) variance /= n;
		else variance = undefined
	}

	if (typeof data === 'string') this.updateStatistics(data, 'variance', variance);
	return variance;
}


/**
	Calculate standard deviation of a set of data values.
	If dataset is only a sample of a larger population,
	Bessel correction should be applied by setting corrected to true.
**/

Statistics.prototype.standardDeviation = function(data, corrected = true) {
	if (typeof data === 'undefined') return this.errorMessage('Standard deviation: No data was supplied.');
	if (typeof data === 'string' && this.checkLastUpdated(data, 'standardDeviation') === false) return this.getStatistics(data, 'standardDeviation');
	let validated = this.validateInput(data, 'interval', 'standard deviation');
	if (validated === false) return;
	if (validated.length < 2) return this.errorMessage('The data supplied to compute standardDeviation needs to contain at least two datasets.');

	let deviation = Math.sqrt(this.variance(data, corrected));

	if (typeof data === 'string') this.updateStatistics(data, 'standardDeviation', deviation);
	return deviation;
}

/**
	The coefficient of variation is a relative parameter of dispersion that expresses the
	standard deviation relative to the expected value of a statistical variable. This allows for comparison
	of variables with significantly diverse expected values.
	The expected value can either be supplied as an additional input parameter or will be substituted
	by the arithmetic mean.
**/

Statistics.prototype.coefficientOfVariation = function(data, expectedValue) {
	if (typeof data === 'undefined') return this.errorMessage('Coefficient of variation: No data was supplied.');
	let validated = this.validateInput(data, 'interval', 'coefficient of variation');
	if (validated === false) return;

	let standardDeviation = this.standardDeviation(validated.data),
		mean = (typeof expectedValue === 'undefined') ? this.mean(validated.data) : expectedValue;
	return (typeof standardDeviation !== 'undefined' && typeof mean !== 'undefined' && mean !== 0) ? standardDeviation / mean : undefined;
}


Statistics.prototype.indexOfDispersion = function(data, expectedValue) {
	if (typeof data === 'undefined') return this.errorMessage('Index of dispersion: No data was supplied.');
	let validated = this.validateInput(data, 'interval', 'coefficient of variation');
	if (validated === false) return;

	let variance = this.variance(validated.data),
		mean = (typeof expectedValue === 'undefined') ? this.mean(validated.data) : expectedValue;
	return (typeof variance !== 'undefined' && typeof mean !== 'undefined' && mean !== 0) ? variance / mean : undefined;
}


Statistics.prototype.geometricStandardDeviation = function(data) {
	if (typeof data === 'undefined') return this.errorMessage('Geomtric standard deviation: No data was supplied.');
	if (typeof data === 'string' && this.checkLastUpdated(data, 'geometricStandardDeviation') === false) return this.getStatistics(data, 'geometricStandardDeviation');
	let validated = this.validateInput(data, 'interval', 'geometric standard deviation');
	if (validated === false) return;

	let len = validated.length,
		mean = this.geometricMean(data),
		deviation = 0,
		error = false;

	for (var i = 0; i < len; i++) {
		if (validated.data[i] <= 0) error = true;
		else deviation += Math.pow(Math.log(validated.data[i] / mean), 2);
	}

	deviation = (error) ? undefined : Math.exp(Math.sqrt(deviation / len));

	if (typeof data === 'string') this.updateStatistics(data, 'geometricStandardDeviation', deviation);
	return deviation;
}

Statistics.prototype.medianAbsoluteDeviation = function(data) {
	if (typeof data === 'undefined') return this.errorMessage('Median absolute deviation: No data was supplied.');
	let validated = this.validateInput(data, 'interval', 'median absolute deviation');
	if (validated === false) return;

	let values = validated.data,
		median = this.median(values);
	if (typeof median === 'undefined') return;

	values = values.map(a => {
		return Math.abs(a - median);
	});

	return this.median(values);
}

Statistics.prototype.cumulativeFrequency = function(data, boundary) {
	if (typeof data === 'undefined') return this.errorMessage('Cumulative frequency: No data was supplied.');
	if (typeof boundary === 'undefined' || !this.isNumeric(boundary)) {
		this.errorMessage('You need to specify a boundary for the cumulative frequency analysis that is either an integer or a floating point number.');
		return;
	}

	let validated = this.validateInput(data, 'ordinal', 'cumulative frequency analysis');
	if (validated === false) return;

	let values = this.sort(validated.data),
		frequency = 0;

	while (boundary >= values[frequency]) { frequency++; }
	return frequency;
}

Statistics.prototype.frequencies = function(data) {
	if (typeof data === 'undefined') return this.errorMessage('Frequencies: No data was supplied.');
	let validated = this.validateInput(data, 'nominal', 'frequencies');
	if (validated === false) return;

	let values = validated.data,
		valueList = {},
		uniques = [];

	for (var i = 0; i < validated.length; i++) {
		let value = values[i];
		if (valueList[value] == null) {
			uniques.push(value);
			valueList[value] = 1;
		} else {
			valueList[value]++;
		}
	}

	uniques = uniques.sort((a, b) => {
		return valueList[b] - valueList[a];
	});

	uniques = uniques.map(item => {
		return { value: item, absolute: valueList[item], relative: valueList[item] / validated.length };
	});

	return uniques;
};

// percentage should be in range [0, 1]
Statistics.prototype.quantile = function(data, percentage = 0.5) {
	if (typeof data === 'undefined') return this.errorMessage('Quantile: No data was supplied.');
	if (!this.isNumeric(percentage) || percentage < 0 || percentage > 1) return this.errorMessage('Quantiles should be called with a percentage value within the range of [0, 1].');

	let validated = this.validateInput(data, 'ordinal', 'quantile');
	if (validated === false) return;

	let num = percentage * validated.length,
		values = this.sort(validated.data);

	return (num % 1 === 0) ? 0.5 * (values[num] + values[num - 1]) : values[Math.floor(num)];
}


Statistics.prototype.quartiles = function(data) {
	if (typeof data === 'undefined') return this.errorMessage('Quartiles: No data was supplied.');
	if (typeof data === 'string' && this.checkLastUpdated(data, 'quartiles') === false) return this.getStatistics(data, 'quartiles');

	let quartiles = [this.quantile(data, 0.25), this.quantile(data, 0.75)];
	if (typeof quartiles[0] !== 'undefined' && typeof quartiles[1] !== 'undefined') {
		this.updateStatistics(data, 'quartiles', quartiles);
		return quartiles;
	} else {
		return;
	}
}


Statistics.prototype.interQuartileRange = function(data) {
	if (typeof data === 'undefined') return this.errorMessage('Interquartile range: No data was supplied.');
	let validated = this.validateInput(data, 'interval', 'interquartile range');
	if (validated === false) return;

	let quartiles = this.quartiles(validated.data);
	return (typeof quartiles !== 'undefined') ? quartiles[1] - quartiles[0] : undefined;
}
Statistics.prototype.skewness = function(data, populationSkewness = false) {
	if (typeof data === 'undefined') return this.errorMessage('Skewness: No data was supplied.');
	if (typeof data === 'string' && this.checkLastUpdated(data, 'skewness') === false) return this.getStatistics(data, 'skewness');
	let validated = this.validateInput(data, 'ordinal', 'skewness');
	if (validated === false) return;
	if (validated.length < 2) return;

	let mean = this.mean(data),
		deviation = this.standardDeviation(data, false),
		sum = 0;

	for (var i = 0; i < validated.length; i++) {
		sum += Math.pow(validated.data[i] - mean, 3);
	}

	let skewness = sum / Math.pow(deviation, 3);
	skewness *= populationSkewness ? (validated.length / ((validated.length - 1) * (validated.length - 2))) : (1 / validated.length);

	if (typeof data === 'string') this.updateStatistics(data, 'skewness', skewness);
	return skewness;
}


Statistics.prototype.kurtosis = function(data) {
	if (typeof data === 'undefined') return this.errorMessage('Kurtosis: No data was supplied.');
	if (typeof data === 'string' && this.checkLastUpdated(data, 'kurtosis') === false) return this.getStatistics(data, 'kurtosis');
	let validated = this.validateInput(data, 'ordinal', 'kurtosis');
	if (validated === false) return;
	if (validated.length < 2) return;

	let mean = this.mean(data),
		deviation = this.standardDeviation(data),
		sum = 0;
			
	for (var i = 0; i < validated.length; i++) {
		sum += Math.pow(validated.data[i] - mean, 4);
	}

	let kurtosis = sum / (validated.length * Math.pow(deviation, 4));

	if (typeof data === 'string') this.updateStatistics(data, 'kurtosis', kurtosis);
	return kurtosis;
}

Statistics.prototype.excessKurtosis = function(data) {
	if (typeof data === 'undefined') return this.errorMessage('Excess kurtosis: No data was supplied.');
	let kurtosis = this.kurtosis(data);
	return (typeof kurtosis !== 'undefined') ? kurtosis - 3 : undefined;
}
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
/********* Student's t-test *********/

Statistics.prototype.studentsTTestOneSample = function(column, nullHypothesisMean) {
	if (typeof nullHypothesisMean === 'undefined' || !this.isNumeric(nullHypothesisMean)) return this.errorMessage("Student's t-test (one sample) requires data and the mean for which the null hypothesis should hold true.");

	let validated = this.validateInput(column, 'interval', "student's t-test (one sample)");
	if (validated === false) return;
	if (validated.length === 0) return;

	let mean = this.mean(validated.data),
		stdiffDev = this.standardDeviation(validated.data);

	let	t = Math.sqrt(validated.length) * (mean - nullHypothesisMean) / stdiffDev,
		df = validated.length - 1,
		p = this.studentsTCumulativeValue(Math.abs(t), df);

	if (p > 0.5) p = 1 - p;

	return { tStatistic: t, degreesOfFreedom: df, pOneSided: p, pTwoSided: 2 * p };
}


Statistics.prototype.studentsTTestTwoSamples = function(firstColumn, secondColumn,
	{ nullHypothesisDifference: nullHypothesisDifference = 0,
	  dependent: dependent = false
	} = {}) {
	if (typeof secondColumn === 'undefined') return this.errorMessage("Student's t-test (two sample) requires data for two columns and the difference of their means for which the null hypothesis should hold true.");

	let validatedFirst = this.validateInput(firstColumn, 'interval', "student's t-test (two sample)"),
		validatedSecond = this.validateInput(secondColumn, 'interval', "student's t-test (two sample)");
	if (validatedFirst === false || validatedSecond === false) return;

	let n = validatedFirst.length,
		m = validatedSecond.length,
		result = {},
		t, df;

	if (n === 0 || m === 0) return;

	if (dependent) {
		let reduced = this.reduceToPairs(validatedFirst.data, validatedSecond.data),
			valuesFirst = reduced.valuesFirst,
			valuesSecond = reduced.valuesSecond;

		let diffDev = 0,
			diffMean = 0;

		// calculate mean difference of first and second column's values
		for (var i = 0; i < reduced.length; i++) {
			diffMean += valuesFirst[i] - valuesSecond[i];
		}

		diffMean /= reduced.length;

		// calculate standard deviation of differences of first and second column's values
		for (var i = 0; i < reduced.length; i++) {
			diffDev += Math.pow(valuesFirst[i] - valuesSecond[i] - diffMean, 2);
		}

		diffDev = Math.sqrt(diffDev / (reduced.length - 1));

		t = Math.sqrt(n) * (diffMean - nullHypothesisDifference) / diffDev;
		df = reduced.length - 1;
		result = { tStatistic: t, degreesOfFreedom: df, missings: reduced.missings };

	} else {
		let meanFirst = this.mean(validatedFirst.data),
			meanSecond = this.mean(validatedSecond.data),
			varianceFirst = this.variance(validatedFirst.data),
			varianceSecond = this.variance(validatedSecond.data),
			weightedVariance = Math.sqrt(((n - 1) * varianceFirst + (m - 1) * varianceSecond) / (n + m - 2));

		t = (meanFirst - meanSecond - nullHypothesisDifference) / weightedVariance;
		t *= Math.sqrt(n * m / (n + m));
		df = n + m - 2;

		result = { tStatistic: t, degreesOfFreedom: df };
	}

	let p = this.studentsTCumulativeValue(t, df);
	if (p > 0.5) p = 1 - p;

	result.pOneSided = p;
	result.pTwoSided = 2 * p;
	return result;
}


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