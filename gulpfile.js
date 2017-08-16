var gulp = require('gulp'),
	concat = require('gulp-concat'),
	mocha = require('gulp-mocha'),
	rename = require('gulp-rename'),
	babel = require('gulp-babel');


var scriptSrc = './source/',
	scriptDst = '.',
	scriptFile = 'statistics.js',
	scriptFileMin = 'statistics.min.js',

	testsSrc = './tests/',

	docDst = './docs/',
	docSrc = docDst + 'source/',
	buildDocs = require(docSrc + 'buildDocs.js'),
	buildDocsMF = require(docSrc + 'buildDocsMultiFile.js'),

	srcList = [
		scriptSrc + 'core.js',
		scriptSrc + 'centralTendency.js',
		scriptSrc + 'dispersion.js',
		scriptSrc + 'shape.js',
		scriptSrc + 'algebra.js',
		scriptSrc + 'correlation.js',
		scriptSrc + 'regression.js',
		scriptSrc + 'distributions.js',
		scriptSrc + 'tests_nonparametric.js',
		scriptSrc + 'tests_parametric.js',
		scriptSrc + 'error.js',
		scriptSrc + 'random.js'
	];


/***
	Build documentation 
 ***/

gulp.task('buildDocs', function() {
	buildDocs('index.html')
		.pipe(gulp.dest(docDst));
});

gulp.task('buildDocsMultiFile', function() {
	buildDocsMF('index.html', docDst)
		.pipe(gulp.dest(docDst));
});



/***
	Perform unit tests
 ***/

gulp.task('test', function() {
	return  gulp.src(testsSrc + '*.js')
				.pipe(mocha());
});



/***
	Build library 
 ***/

gulp.task('build', ['buildDocsMultiFile'], function() {
	return  gulp.src(srcList)
				.pipe(concat(scriptFile))
				.pipe(gulp.dest(scriptDst))
				.pipe(rename(scriptFileMin))
				.pipe(babel({presets: ['babili']}))
				.pipe(gulp.dest(scriptDst));
});

