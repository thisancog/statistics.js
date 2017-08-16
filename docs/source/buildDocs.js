var buildDocs = function(filename) {
	var gutil = require('gulp-util');

	this.data = 'data.json';
	this.general = null;
	this.content = null;

	this.loadContent = function() {
		var path = require('path'),
			fs = require('fs'),
			file = path.join(__dirname, this.data),
			json = JSON.parse(fs.readFileSync(file, 'utf8'));

		this.general = json.general;
		this.content = json.content;
	}

	this.getHeader = function() {
		if (!this.general) return;

		var html = '<!DOCTYPE html><html lang="en" class="no-js"><head><meta charset="utf-8" /><meta http-equiv="x-ua-compatible" content="ie=edge"><meta name="viewport" content="width=device-width, initial-scale=1.0">';

		if (this.general.title)
			html += '<title>' + this.general.title + ' - Documentation</title>';
		html += '<script>var html = document.getElementsByClassName("no-js"); for (var i = 0; i < html.length; i++) { html[i].className = "js"; } </script><link href="inc/style.css" rel="stylesheet" /><link href="https://fonts.googleapis.com/css?family=Source+Sans+Pro:400,400i,600" rel="stylesheet"><script src="inc/script.js"></script></head><body><div class="wrapper"><div class="header"><div class="header-inner"><div class="title-line">';
		if (this.general.title)
			html += '<h1 class="title gamma">' + this.general.title + '</h1>';
		html += '<h2 class="subtitle zeta">Documentation</h2></div><div class="header-menu"><ul>';
		if (this.general.version)
			html += '<li>v' + this.general.version + '</li>';
		if (this.general.github)
			html += '<li class="uc"><a href="' + this.general.github + '" target="_blank" rel="noopener">Github</a></li>';
		if (this.general.download)
			html += '<li><a href="' + this.general.download + '" target="_blank" rel="noopener"><span class="uc">Download</span> (minified)</a></li>';

		return html + '</ul></div></div></div><div class="main">';
	}

	this.getFooter = function() {
		if (!this.general) return;

		var html = '</div><div class="footer"><div class="footer-inner">';

		if (this.general.footerText)
			html += '<div class="disclaimer">' + this.general.footerText + '</div>';
		html += '<div class="legal">';
		if (this.general.license && this.general.license.name)
			html += '<a href="#license" target="_blank" rel="noopener">' + this.general.license.name + '</a>, ';
		if (this.general.creation) {
			var today = new Date();
			html += this.general.creation + ' &ndash; ' + today.getFullYear();
		}
		return html + '</div></div></div></div></body></html>';
	}

	this.getMain = function() {
		if (!this.content) return;

		var obj = this,
			html = '<div class="content">';

		[].forEach.call(obj.content, function(section) {
			html += '<div class="section">';
			html += '<div class="section-title"><h3><a id="' + obj.getHash('section-' + section.section) + '">' + section.section + '</a></h3></div>';
			if (section.description)
				html += '<div class="section-description">' + section.description + '</div>';
			html += '<div class="section-entries">';

			[].forEach.call(section.items, function(item) {
				html += '<div class="single-entry' + (item.unfinished ? ' unfinished' : '') + '"><div class="single-entry-header">';
				html += '<div class="single-entry-title"><h4><a id="' + obj.getHash(item.title) + '">' + item.title + '</a></h4></div>';
				html += '<div class="single-entry-meta' + (typeof item.testWritten !== 'undefined' && !item.testWritten ? ' untested' : '') + '">';

				html += '<div class="single-entry-link"><a href="#' + obj.getHash(item.title) + '">#</a></div>';
				if (item.resources) {
					[].forEach.call(item.resources, function(resource) {
						html += '<div class="single-entry-resource tooltip"><a href="' + resource + '" target="_blank" rel="noopener">More info</a><span>Read more at ' + obj.hostName(resource) + '</span></div>';
					});
				}
				if (item.lastUpdated) {
					if (item.lastUpdated === this.general.version && item.lastUpdated !== '1.0')
						html += '<div class="single-entry-last-updated new-changes tooltip">new<span>Last updated in the current version ' + item.lastUpdated + '</span></div>';
					else
						html += '<div class="single-entry-last-updated tooltip">' + item.lastUpdated + '<span>Last updated in version ' + item.lastUpdated + '</span></div>';
				}

				if (item.hasOwnProperty('stored'))
					html += '<div class="single-entry-stored tooltip" data-stored="' + item.stored + '"><span>The result of this method is ' + (item.stored ? '' : 'not ') + ' internally stored.</span></div>';

				html += '</div></div>';


				if (item.content)
					html += '<div class="single-entry-body">' + item.content + '</div>';

				if (item.formulas) {
					html += '<div class="single-entry-formulas"><h5>' + (item.formulas.length == 1 ? 'Formula' : 'Formulas') + ':</h5>';
					[].forEach.call(item.formulas, function(formula) {
						html += '<div class="single-formula">';
						if (formula.title)
							html += '<span class="single-formula-title">' + formula.title + '</span>';
						if (formula.formula)
							html += '<div class="latex-formula" data-formula="' + formula.formula + '"></div>';
						html += '</div>';
					});
					html += '</div>';
				}

				if (item.parameters)
					html += '<div class="single-entry-parameters"><h5>Parameters:</h5>' + this.parseParameters(item.parameters) + '</div>';

				if (item.scales)
					html += '<div class="single-entry-scales"><h5>Scales of measure:</h5><a href="#scalesofmeasure">' + item.scales.join(', ') + '</a></div>';

				if (item.usage)
					html += '<div class="single-entry-usage"><h5>Usage:</h5><pre class="lang-js"><code>' + item.usage + '</code></pre></div>';

				if (item.returns)
					html += '<div class="single-entry-returns"><h5>Returns:</h5><pre class="lang-js"><code>' + item.returns + '</code></pre></div>';
				html += '</div>';
			});

			html += '</div></div>';
		});

		return html + '</div>';
	};

	this.parseParameters = function(params, isOptions = false) {
		var html = '';

		[].forEach.call(params, function(param) {
			var options = param.options,
				types = param.types,
				paramClass;

			if (typeof options !== 'undefined') {
				html += '<div class="options-list"><h5>Options:</h5>' + this.parseParameters(options, true) + '</div>';
			} else {
				html += '<div class="single-param">';

				if (typeof types !== 'undefined') {
					types = types.map(function(type) {
						typeLower = type.toLowerCase();

						if (typeLower === 'integer' || typeLower === 'float') paramClass = 'number';
						if (typeLower === 'string' || typeLower === 'object' || typeLower === 'array' || typeLower === 'json encoded string') paramClass = 'string';
						if (typeLower === 'boolean') paramClass = 'boolean';
						if (typeLower === 'function') paramClass = 'function';

						return '<span class="param-type token ' + paramClass + '">' + type + '</span>';
					});

					types = (types.length > 1) ? types.slice(0, -1).join(', ') + ' or ' + types[types.length - 1] : types.join('');
					html += '(' + types + ') ';
				}

				html += '<span class="param-name">' + param.name + '</span>';
				if (!isOptions)
					html += ' (<span class="param-required">' + (param.required ? 'required' : 'optional') + '</span>';
				if (typeof param.default !== 'undefined')
					html += (!isOptions ? ', ' : ' (') + '<span class="param-default">default: <span class="param-default-value token ' + paramClass + '">' + param.default + '</span></span>';
				html += (isOptions && typeof param.default === 'undefined') ? '</div>' : ')</div>';
			}
		});

		return html;
	}

	this.getSidebar = function() {
		if (!this.content) return;

		var obj = this,
			html = '<div class="sidebar"><div class="sidebar-intro"><h3>Table of contents</h3><div class="sidebar-desc">' + obj.content[0].items[0].content + '</div></div>';
		html += '<div class="sidebar-sections">';

		[].forEach.call(obj.content, function(section) {
			html += '<div class="section">';
			html += '<h5><a href="#' + obj.getHash('section-' + section.section) + '">' + section.section + '</a></h5>';
			html += '<ul class="menu">';

			[].forEach.call(section.items, function(item) {
				html += '<li class="' + (item.unfinished ? ' unfinished' : '') + (typeof item.testWritten !== 'undefined' && !item.testWritten ? ' untested' : '') + '""><a href="#' + obj.getHash(item.title) + '">' + item.title + '</a></li>';
			});

			html += '</ul></div>';
		});

		return html + '</div></div>';
	}

	this.getHash = function(title) {
		return encodeURIComponent(title.toLowerCase().replace(/\s|\(|\)/g, ''));
	};

	this.hostName = function(string) {
		var host;
		if (string.indexOf("://") > -1) {
			host = string.split('/')[2];
		} else {
			host = string.split('/')[0];
		}

		host = host.split(':')[0].split('?')[0];
		
		var splitArr = host.split('.'),
			segments = splitArr.length;

		if (segments > 2) {
			host = splitArr[segments - 2] + '.' + splitArr[segments - 1];
		}
		return host;
	}

	this.concatParts = function() {
		return this.getHeader() + this.getSidebar() + this.getMain() + this.getFooter();
	}

	this.createFromString = function(filename) {
		var src = require('stream').Readable({ objectMode: true }),
			content = this.concatParts();
		src._read = function () {
			this.push(new gutil.File({
				cwd: "",
				base: "",
				path: filename,
				contents: new Buffer(content)
			}));
			this.push(null);
		}
		return src;
	}

	this.loadContent();
	return this.createFromString(filename);
};

module.exports = buildDocs;

