var buildDocs = function(filename, dist, readmeMD = false) {
	var gutil = require('gulp-util'),
		fs = require('fs'),
		path = require('path');

	this.data = 'data.json';
	this.general = null;
	this.content = null;
	this.files = [filename];

	this.loadContent = function() {
		var file = path.join(__dirname, this.data),
			json = JSON.parse(fs.readFileSync(file, 'utf8'));

		this.general = json.general;
		this.content = json.content;
	}

	this.getSections = function() {
		if (!this.content) return;

		var obj = this,
			sections = [];

		[].forEach.call(obj.content, function(section, index) {
			var newSection = {
				index: index,
				name: section.section,
				filename: section.file
			};
			sections.push(newSection);
		});

		return sections;

	}

	this.getHeader = function(file) {
		if (!this.general) return;

		var path = (file[0].filename === 'index.html') ? 'inc/' : '',
			html = '<!DOCTYPE html><html lang="en" class="no-js"><head><meta charset="utf-8" /><meta http-equiv="x-ua-compatible" content="ie=edge"><meta name="viewport" content="width=device-width, initial-scale=1.0">';

		if (this.general.title)
			html += '<title>' + this.general.title + ' - Documentation</title>';
		html += '<script>var html = document.getElementsByClassName("no-js"); for (var i = 0; i < html.length; i++) { html[i].className = "js"; } </script><link href="' + path + 'style.css" rel="stylesheet" /><link href="https://fonts.googleapis.com/css?family=Nunito:300,400|Source+Sans+Pro:400,400i,600" rel="stylesheet"><script src="' + path + 'script.js"></script></head><body><div class="wrapper"><div class="header"><div class="header-inner"><div class="title-line">';
		if (this.general.title) {
			var home = (file[0].filename === 'index.html') ? this.general.title : '<a href="../index.html">' + this.general.title + '</a>';
			html += '<h1 class="title gamma">' + home + '</h1>';
		}
		html += '<h2 class="subtitle zeta af">Documentation</h2></div><div class="header-menu"><ul>';
		if (this.general.version)
			html += '<li>v' + this.general.version + '</li>';
		if (this.general.github)
			html += '<li class="uc"><a href="' + this.general.github + '" target="_blank" rel="noopener">Github</a></li>';
		if (this.general.download)
			html += '<li><a href="' + this.general.download + '" target="_blank" rel="noopener" download><span class="uc">Download</span> (minified)</a></li>';

		return html + '</ul></div></div></div><div class="main">';
	}

	this.getFooter = function() {
		if (!this.general) return;

		var html = '</div><div class="footer"><div class="footer-inner">';

		if (this.general.footerText)
			html += '<div class="disclaimer">' + this.general.footerText + '</div>';
		html += '<div class="legal">';
		if (this.general.license && this.general.license.name && this.general.license.url)
			html += '<a href="' + this.general.license.url + '" target="_blank" rel="noopener">' + this.general.license.name + '</a>, ';
		if (this.general.creation) {
			var today = new Date();
			html += this.general.creation + ' &ndash; ' + today.getFullYear();
		}
		return html + '</div></div></div></div></body></html>';
	}

	this.getMain = function(file) {
		if (!this.content) return;

		var sections = file.map(item => { return item.name; }),
			obj = this,
			html = '<div class="content">';

		[].forEach.call(obj.content, function(section) {
			if (sections.indexOf(section.section) >= 0) {

				html += '<div class="section">';
				html += '<div class="section-title"><h3 class="af"><a id="' + obj.getHash('section-' + section.section) + '">' + section.section + '</a></h3></div>';
				if (section.description)
					html += '<div class="section-description">' + section.description + '</div>';
				html += '<div class="section-entries">';

				[].forEach.call(section.items, function(item) {
					html += '<div class="single-entry' + (item.unfinished ? ' unfinished' : '') + '"><div class="single-entry-header">';
					html += '<div class="single-entry-title"><h4 class="af"><a id="' + obj.getHash(item.title) + '">' + item.title + '</a></h4></div>';
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

					if (item.scales) {
						let link = (section.section === 'Introduction') ? '' : '../index.html' ;
						html += '<div class="single-entry-scales"><h5>Scales of measure:</h5><a href="' + link + '#scalesofmeasure">' + item.scales.join(', ') + '</a></div>';
					}

					if (item.usage)
						html += '<div class="single-entry-usage"><h5>Usage:</h5><pre class="lang-js"><code>' + item.usage + '</code></pre></div>';

					if (item.returns)
						html += '<div class="single-entry-returns"><h5>Returns:</h5><pre class="lang-js"><code>' + item.returns + '</code></pre></div>';
					html += '</div>';
				});

				html += '</div></div>';
			}
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

	this.getSidebar = function(file) {
		if (!this.content) return;

		var sections = file.map(item => { return item.name; }),
			obj = this,
			html = '<div class="sidebar"><div class="sidebar-intro"><h3>Table of contents</h3><div class="sidebar-desc">' + obj.content[0].items[0].content + '</div></div>',
			firstfile = null;
		html += '<div class="sidebar-sections">';

		[].forEach.call(obj.content, function(section) {
			if (sections.indexOf(section.section) >= 0) {
				html += '<div class="section">';
				html += '<h5><a href="#' + obj.getHash('section-' + section.section) + '">' + section.section + '</a></h5>';
				html += '<ul class="menu">';

				[].forEach.call(section.items, function(item) {
					html += '<li class="' + (item.unfinished ? ' unfinished' : '') + (typeof item.testWritten !== 'undefined' && !item.testWritten ? ' untested' : '') + '""><a href="#' + obj.getHash(item.title) + '">' + item.title + '</a></li>';
				});

				html += '</ul></div>';
			} else {
				var folder = (file[0].filename === 'index.html') ? 'inc/' + section.file : section.file;
				if (section.file === 'index.html') folder = '../' + folder;
				if (firstfile === section.file) folder += '#' + obj.getHash('section-' + section.section);
				firstfile = section.file;

				html += '<div class="section section-nocontent">';
				html += '<h5' + (file[0].filename === 'index.html' ? ' class="abc"' : '') + '><a href="' + folder + '">' + section.section + '</a></h5></div>';
			}
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

	this.getReadme = function() {
		if (!this.content) return;
		var obj = this,
			markup = '# ' + this.general.title + ' #\n';
		markup += '\n\n## Documentation ##\n\nYou can find the [full documentation here](' + obj.general.linkToDocs + ').\n\n';

		[].forEach.call(this.content, function(section) {
			if (section.section !== 'Introduction') return;

			if (section.description)
				markup += section.description + '\n';

			[].forEach.call(section.items, function(item) {
				markup += '## ' + item.title + ' ##\n';

				if (item.content)
					markup += item.content + '\n\n';

				if (item.usage)
					markup += '**Usage:**\n\n```\n' + item.usage + '\n```\n\n';

				if (item.returns)
					markup += '**Returns:**\n\n```\n' + item.returns + '\n```\n\n';
			});
		});

		// clean up rogue HTML
		markup = markup.replace(/<h5>([^<]+).*?<\/h5>/gm, '\n\n##### $1 #####\n\n');
		markup = markup.replace(/<em>([^<]+).*?<\/em>/gm, '*$1*');
		markup = markup.replace(/<p>([^<]+).*?<\/p>/gm, '$1\n');
		markup = markup.replace(/(<li>)/gm, '\n\n+ ');
		markup = markup.replace(/(<\/li>)/gm, '');
		markup = markup.replace(/(<ul>)|(<\/ul>)|(<ol>)|(<\/ol>)/gm, '\n\n');
		markup = markup.replace(/<pre.*?><code.*?>([^<]+).*?<\/code><\/pre>/gm, '\n\n```\n$1\n```\n\n');
		markup = markup.replace(/<code.*?>([^<]+).*?<\/code>/gm, '`$1`');
		markup = markup.replace(/<a.*?>([^<]+).*?<\/a>/gm, '$1');
		
		markup = markup.replace(/<b>([^<]+).*?<\/b>/gm, '**$1**');
		markup = markup.replace(/&lt;/gm, '<');
		markup = markup.replace(/&gt;/gm, '>');
		markup = markup.replace(/(<br>)/gm, '\n');
		markup = markup.replace(/(&hellip;)/gm, '…');
		markup = markup.replace(/(&rsquo;)/gm, '’'); 

		return markup;
	}

	this.concatParts = function(file) {
		return this.getHeader(file) + this.getSidebar(file) + this.getMain(file) + this.getFooter();
	}

	this.createFromString = function(destfile, dist, readmeMD = false) {
		var src = require('stream').Readable({ objectMode: true }),
			sections = this.getSections(),
			obj = this,
			result;

		if (readmeMD) {
			src._read = function () {
				var content = obj.getReadme();

				this.push(new gutil.File({
					cwd: "",
					base: "",
					path: destfile,
					contents: new Buffer(content)
				}));
				this.push(null);
			}
			return src;
		}

		var files = sections.map(function(item, index) { return item.filename; });
		files = files.filter(function(item, index) { return files.indexOf(item) === index });
		files = files.reduce((obj, key) => Object.assign(obj, {[key]: []}), {});
		sections.forEach(function(section) { files[section.filename].push(section); });

		for (var file in files) {
			if (files.hasOwnProperty(file)) {
				
				if (file === destfile) {
					src._read = function () {
						var content = obj.concatParts(files[destfile]);

						this.push(new gutil.File({
							cwd: "",
							base: "",
							path: destfile,
							contents: new Buffer(content)
						}));
						this.push(null);
					}
					result = src;
				} else {
					var filepath = path.join(__dirname, '../inc/', file),
						content = this.concatParts(files[file]);;

					fs.writeFile(filepath, content, { flag: 'w' }, function(error) {
						if (error) throw error;
					});
				}
			}
		}

		return result;
	}

	this.loadContent();
	return this.createFromString(filename, dist, readmeMD);
};

module.exports = buildDocs;
