# statistics.js #
## About ##
statistics.js is a lightweight library to provide all basic and many advanced utilities commonly used in statistical data analysis. It is free to use, open source and open for contributions.

## Download and installation ##


##### Direct download for use in the browser #####

Download the latest version of statistics.js and save it to a folder accessible to your project. Simply reference the file and you’re good to go: 

```
<script src="../path/to/statistics.min.js" type="text/javascript"></script>
```



##### Install from the command line #####

Install from the command line with NPM, Yarn or Bower:


```
$ npm install statistics.js
$ yarn add statistics.js
$ bower install statistics.js --save
```

And then require the module in your project:


```
var Statistics = require('/path/to/statistics.js');
```



## Getting started ##
Initialise statistics.js as a new object, feeding it your data and &mdash; optionally but highly recommended &mdash; an object containing information about the data columns. There are also a number of settings available. You can then start calling methods as usual: 

```
var data = [
	{ ID: 1, age: 33 },
	{ ID: 2, age: 42 },
	{ ID: 3, age: 27 },
	…
];

var columns = {
	ID: 'ordinal',
	age: 'interval'
	…
};

var settings = { … };

var stats = new Statistics(data, columns, settings);

var meanAge = stats.arithmeticMean("age");
var stdDevAge = stats.standardDeviation("age");
```



**Returns:**

```
meanAge: 34
stdDevAge: 7.54983…
```

## Entering data ##
Data should be entered on initialisation in a well formatted way, i.e. as an array where each item is an object that stores information for each variable, e.g. 

```
var data = [
	{ age: 32, agreement: 'none', iq: 104 },
	{ age: 45, agreement: 'somewhat', iq: 110 },
	…
];
```

 Alternatively, data can be entered as a JSON encoded string that evaluates to the same structure. Later on, new datasets can be added with the addData() and addRow() methods. Any missing values will be filled in with `NaN`. Along with the data, an object containing information about all variables, their scales of measurement and, optionally, their value maps should be specified. Possible scales of measure include "*nominal*", "*ordinal*", "*interval*" and "*metric*" (see Scales of measure for an explanation of the differences). Value maps are arrays of all the possible values of a (usually nordinal) variable and can be optionally defined to help properly labelling the values that are internally stored as integers. The order of the items within the value map should reflect the order of ordinal data from lowest to largest. 

```
var columns = {
	age: 'metric',
	agreement: {
		scale: 'ordinal',
		valueMap: ['none', 'somewhat', 'undecided', 'much', 'total']
	},
	iq: 'metric'
};

var stats = new Statistics(data, columns);
```

The definition `someVariable: someScale` is equivalent to `someVariable: { scale: someScale }`.

## Scales of measure ##
Statistical variables are usually distinguished by there scale of measure. A scale of measure describes the nature of the data assigned to a variable and thus permits (and forbids) how the variable can be manipulated and treated by statistical methods. It is highly encouraged to declare the scale of measure for each variable, as statistics.js will prevent any methods that are not valid for a given variable based on its scale of measurement. (see above on how to define a variable’s scale of measure)

According to Stanley Smith Stevens’ typology, scales of measure can be ordered by their level of sophisticiation where a given scale inherits all the valid methods from its precursor and adds new features:



+ **nominal scale**: This scale allows for classification only. The possible values are all distinct and mutually exclusive, can not be ordered or quantified. Therefore, values allow only for equality, not for comparison, can not be summed, substracted, multiplied or divided. The mode &ndash; the most common value &ndash; can be computed. A nominal variable that has only two values is also called dichotomous. Examples: gender, nationality, genre.

+ **ordinal scale**: This scale introduces order in the form of ranks but does not account for the amount of difference between two given values. Values can be compared and sorted, but not summed, substracted, multiplied or divided. The median &ndash; the middle rank &ndash; can be computed. Some dichotomous variables can be on the ordinal scale if there is a sense of order, such as "*guilty*"/ "*not guilty*". Non-dichotomous examples include the Likert scale for measuring the level of agreement ("*disagree*", "*somewhat disagree*", "*neutral*", "*somewhat agree*", "*agree*") or school grades (where technically the difference between two values is not defined but often the arithmetic mean is calculated anyway).

+ **interval scale**: This scale extends the ordinal scale by defining the amount of difference between two given values, e.g. the base metric upon which the space of all valid values is constructed. It introduces addition and subtraction, but does not allow for multiplication nor division as it lacks a meaningful, natural zero. For example, on the Celsius temperature scale, it is not meaningful to say that 30&deg;C is twice as hot as 15&deg;C. On the interval scale, the arithmetic mean and the standard deviation can be determined. Examples: temperature on the Celsius scale (0&deg;C is an arbitrary zero, whereas 0&deg;K is a natural zero), percentage, location in space.

+ **metric scale**: This scale extends the interval scale by defining a meaningful zero and therefore permits multiplication and division. The geometric and the harmonic mean are introduced on this scale. Examples: mass, length, concentration of a chemical compound.



## Settings ##
There are several settings you can adjust in order to change the behaviour of the library. You can pass one or several of them as an object upon initialisation. 



+ `epsilon` (*default*: `0.00001`): The calculation of some statistical methods would progress forever, however for computational means a stopping variable epsilon is introduced. It’s value is used as the boundary until where a iterative method will be executed. Generally, smaller values give more precision and result in longer computation times.

+ `excludeColumns` (*default*: `["ID", "id"]`): Accepts an array of strings that are names of the columns to ignore when assigning a scale of measure.

+ `incompleteBetaIterations` (*default*: `40`): Accepts the number of iterations the method for the computation of the incomplete beta function will go through. Larger numbers give more precision.

+ `incompleteGammaIterations` (*default*: `80`): Accepts the number of iterations the method for the computation of the incomplete gamma function will go through. Larger numbers give more precision.

+ `maxBarnardsN` (*default*: `200`): Defines the maximum number of datasets that Barnard’s test will accept due to performance. Change with caution.

+ `spougeConstant` (*default*: `40`): Defines the constant `a` in Spouge’s approximation of the gamma function.

+ `suppressWarnings` (*default*: `false`): Set this to `true` to prevent all warnings from being sent to the console.

+ `zTableIterations` (*default*: `25`): Some statistical tests like the Mann-Whitney-U test require a z table to look up probabilities of the cumulative distribution function of the normal distribution. This table will be automatically computed when needed, with as many iterations as defined here. The default value should be suitable for most cases, however, you may find a lower value for shorter computation times or a higher value for additional accuracy helpful.



**Usage:**

```
var settings = {
	excludeColumns: ["ID", "patientNumber"],
	suppressWarnings: true,
	zTableIterations: 15
};
var stats = new Statistics(data, columns, settings);
```

## License ##
statistics.js is open source and free to use, protected by the MIT License:

Copyright 2016 &ndash; 2017 Matthias Planitzer and all contributors

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

## Contribute ##
statistics.js is open source and open for contributions. If you’re a programmer or a statistician, feel free to take part in this project! This library is hosted and maintained in a Github repository, where you can find the source code and commit to the project. Since I don’t hold a degree in statistics, biometrics or anything similar, professional input is much appreciated. Also, if you find a bug, please report it on Github as well.

