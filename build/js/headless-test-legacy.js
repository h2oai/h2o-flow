(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(factory());
}(this, function () { 'use strict';

	function printUsageAndExit(phantom, message) {
	  console.log(`*** ${message} ***`);
	  console.log('Usage: phantomjs headless-test.js [--host ip:port] [--timeout seconds] [--packs foo:bar:baz] [--perf date buildId gitHash gitBranch ncpu os jobName outputDir] [--excludeFlows flow1;flow2]');
	  console.log('    ip:port      defaults to localhost:54321');
	  console.log('    timeout      defaults to 3600');
	  console.log('    packs        defaults to examples');
	  console.log('    perf         performance of individual tests will be recorded in perf.csv in the output directory');
	  console.log('    excludeFlows do not run these flows');
	  return phantom.exit(1);
	}

	function parseOpts(phantom, args) {
	  console.log('parseOpts was called');
	  let i;
	  console.log(`Using args ${args.join(' ')}`);
	  i = 0;
	  const opts = {};
	  while (i < args.length) {
	    if (args[i] === '--host') {
	      i = i + 1;
	      if (i > args.length) {
	        printUsageAndExit(phantom, `Unknown argument: ${args[i]}`);
	      }
	      opts.hostname = args[i];
	    } else if (args[i] === '--timeout') {
	      i = i + 1;
	      if (i > args.length) {
	        printUsageAndExit(phantom, `Unknown argument: ${args[i]}`);
	      }
	      opts.timeout = args[i];
	    } else if (args[i] === '--packs') {
	      i = i + 1;
	      if (i > args.length) {
	        printUsageAndExit(phantom, `Unknown argument: ${args[i]}`);
	      }
	      opts.packs = args[i];
	    } else if (args[i] === '--perf') {
	      opts.perf = true;
	      i = i + 1;
	      if (i > args.length) {
	        printUsageAndExit(phantom, `Unknown argument: ${args[i]}`);
	      }
	      opts.date = args[i];
	      i = i + 1;
	      if (i > args.length) {
	        printUsageAndExit(phantom, `Unknown argument: ${args[i]}`);
	      }
	      opts.buildId = args[i];
	      i = i + 1;
	      if (i > args.length) {
	        printUsageAndExit(phantom, `Unknown argument: ${args[i]}`);
	      }
	      opts.gitHash = args[i];
	      i = i + 1;
	      if (i > args.length) {
	        printUsageAndExit(phantom, `Unknown argument: ${args[i]}`);
	      }
	      opts.gitBranch = args[i];
	      i = i + 1;
	      if (i > args.length) {
	        printUsageAndExit(phantom, `Unknown argument: ${args[i]}`);
	      }
	      opts.ncpu = args[i];
	      i = i + 1;
	      if (i > args.length) {
	        printUsageAndExit(phantom, `Unknown argument: ${args[i]}`);
	      }
	      opts.os = args[i];
	      i = i + 1;
	      if (i > args.length) {
	        printUsageAndExit(phantom, `Unknown argument: ${args[i]}`);
	      }
	      opts.jobName = args[i];
	      i = i + 1;
	      if (i > args.length) {
	        printUsageAndExit(phantom, `Unknown argument: ${args[i]}`);
	      }
	      opts.outputDir = args[i];
	    } else if (args[i] === '--excludeFlows') {
	      i = i + 1;
	      if (i > args.length) {
	        printUsageAndExit(phantom, `Unknown argument: ${args[i]}`);
	      }
	      opts.excludeFlows = args[i];
	    } else {
	      printUsageAndExit(phantom, `Unknown argument: ${args[i]}`);
	    }
	    i = i + 1;
	  }
	  return opts;
	}

	function onErrorFunction(phantom, message, stacktrace) {
	  console.log('phantom.onError was called');
	  let stack;
	  let t;
	  if (stacktrace != null ? stacktrace.length : void 0) {
	    stack = (() => {
	      let _i;
	      let _len;
	      const _results = [];
	      for (_i = 0, _len = stacktrace.length; _i < _len; _i++) {
	        t = stacktrace[_i];
	        _results.push(` -> ${t.file || t.sourceURL}: ${t.line}${t['function'] ? ' (in function ' + t['function'] + ')' : ''}`); // eslint-disable-line
	      }
	      return _results;
	    })();
	    console.log(`PHANTOM: *** ERROR *** ${message}\n${stack.join('\n')}`);
	    return phantom.exit(1);
	  }
	}

	function onResourceError(_arg) {
	  const url = _arg.url;
	  const errorString = _arg.errorString;
	  return console.log(`BROWSER: *** RESOURCE ERROR *** ${url}: ${errorString}`);
	}

	function onConsoleMessageFunction(message) {
	  return console.log(`BROWSER: ${message}`);
	}

	/* eslint-disable global-require */

	function onCallbackFunction(perfLine, page) {
	  const fs = require('fs');
	  return fs.write(`${page._outputDir}/perf.csv`, perfLine, 'a');
	}

	function retest(phantom, startTime, timeout, isComplete, test, onReady, interval) {
	  if (new Date().getTime() - startTime < timeout && !isComplete) {
	    console.log('PHANTOM: PING');
	    isComplete = test();
	    return isComplete;
	  }
	  if (isComplete) {
	    onReady();
	    return clearInterval(interval);
	  }
	  console.log('PHANTOM: *** ERROR *** Timeout Exceeded');
	  return phantom.exit(1);
	}

	function waitFor(phantom, test, onReady, timeout) {
	  let interval = undefined;
	  const startTime = new Date().getTime();
	  const isComplete = false;
	  interval = setInterval(retest(phantom, startTime, timeout, isComplete, test, onReady, interval), 2000);
	  return interval;
	}

	function statusFunction(phantom, waitFor, page, packNames, opts, hostname, excludeFlowsNames, status) {
	  let printErrors;
	  let test;
	  console.log('status from page.open', status);
	  if (status === 'success') {
	    return waitFor(phantom, test.bind(this, page, packNames, opts, hostname, excludeFlowsNames), () => {
	      let flowTitle;
	      let testCount;
	      let testStatus;
	      const errors = page.evaluate(() => window._phantom_errors_);
	      if (errors) {
	        console.log('------------------ FAILED -------------------');
	        console.log(printErrors(errors));
	        console.log('---------------------------------------------');
	        return phantom.exit(1);
	      }
	      const summary = page.evaluate(() => window._phantom_test_summary_);
	      console.log('------------------ PASSED -------------------');
	      testCount = 0;
	      for (flowTitle in summary) {
	        if (Object.prototype.hasOwnProperty.call(summary, flowTitle)) {
	          testStatus = summary[flowTitle];
	          console.log(`${testStatus}: ${flowTitle}`);
	          testCount++;
	        }
	      }
	      console.log(`(${testCount} tests executed.)`);
	      console.log('---------------------------------------------');
	      return phantom.exit(0);
	    });
	  }
	  console.log('PHANTOM: *** ERROR *** Unable to access network.');
	  return phantom.exit(1);
	}

	var _args = [[{ "raw": "webpage@0.3.0", "scope": null, "escapedName": "webpage", "name": "webpage", "rawSpec": "0.3.0", "spec": "0.3.0", "type": "version" }, "/Users/m/workspace/h2o-flow"]];
	var _from = "webpage@0.3.0";
	var _id = "webpage@0.3.0";
	var _inCache = true;
	var _location = "/webpage";
	var _nodeVersion = "1.8.1";
	var _npmUser = { "name": "serapath", "email": "dev@serapath.de" };
	var _npmVersion = "2.8.3";
	var _phantomChildren = {};
	var _requested = { "raw": "webpage@0.3.0", "scope": null, "escapedName": "webpage", "name": "webpage", "rawSpec": "0.3.0", "spec": "0.3.0", "type": "version" };
	var _requiredBy = ["#DEV:/"];
	var _resolved = "https://registry.npmjs.org/webpage/-/webpage-0.3.0.tgz";
	var _shasum = "15c8c99e822b499e9981ae6876539b423448b8e7";
	var _shrinkwrap = null;
	var _spec = "webpage@0.3.0";
	var _where = "/Users/m/workspace/h2o-flow";
	var author = { "name": "serapath", "email": "dev@serapath.de", "url": "http://www.github.com/serapath" };
	var dependencies = {};
	var description = "Webpage Boilerplate Component";
	var devDependencies = {};
	var directories = {};
	var dist = { "shasum": "15c8c99e822b499e9981ae6876539b423448b8e7", "tarball": "https://registry.npmjs.org/webpage/-/webpage-0.3.0.tgz" };
	var gitHead = "2839c56a95bd447b78de503b15d619185750e7c4";
	var keywords = ["boilerplate", "webpage", "component"];
	var license = "MIT";
	var main = "SOURCE/index.js";
	var maintainers = [{ "name": "serapath", "email": "dev@serapath.de" }];
	var name = "webpage";
	var optionalDependencies = {};
	var readme = "ERROR: No README data found!";
	var scripts = { "test": "echo \"Error: no test specified\" && exit 1" };
	var version = "0.3.0";
	var _package = {
		_args: _args,
		_from: _from,
		_id: _id,
		_inCache: _inCache,
		_location: _location,
		_nodeVersion: _nodeVersion,
		_npmUser: _npmUser,
		_npmVersion: _npmVersion,
		_phantomChildren: _phantomChildren,
		_requested: _requested,
		_requiredBy: _requiredBy,
		_resolved: _resolved,
		_shasum: _shasum,
		_shrinkwrap: _shrinkwrap,
		_spec: _spec,
		_where: _where,
		author: author,
		dependencies: dependencies,
		description: description,
		devDependencies: devDependencies,
		directories: directories,
		dist: dist,
		gitHead: gitHead,
		keywords: keywords,
		license: license,
		main: main,
		maintainers: maintainers,
		name: name,
		optionalDependencies: optionalDependencies,
		readme: readme,
		scripts: scripts,
		version: version
	};

var _package$1 = Object.freeze({
		_args: _args,
		_from: _from,
		_id: _id,
		_inCache: _inCache,
		_location: _location,
		_nodeVersion: _nodeVersion,
		_npmUser: _npmUser,
		_npmVersion: _npmVersion,
		_phantomChildren: _phantomChildren,
		_requested: _requested,
		_requiredBy: _requiredBy,
		_resolved: _resolved,
		_shasum: _shasum,
		_shrinkwrap: _shrinkwrap,
		_spec: _spec,
		_where: _where,
		author: author,
		dependencies: dependencies,
		description: description,
		devDependencies: devDependencies,
		directories: directories,
		dist: dist,
		gitHead: gitHead,
		keywords: keywords,
		license: license,
		main: main,
		maintainers: maintainers,
		name: name,
		optionalDependencies: optionalDependencies,
		readme: readme,
		scripts: scripts,
		version: version,
		default: _package
	});

	var require$$0 = ( _package$1 && _package$1['default'] ) || _package$1;

	/******************************************************************************
	  DEPENDENCIES
	******************************************************************************/
	var pkg = require$$0;
	/******************************************************************************
	  PARAMETER = ARGUMENT
	******************************************************************************/
	// no cli tool
	/******************************************************************************
	  EXPORT
	******************************************************************************/
	var __moduleExports = config$1;
	/******************************************************************************
	  EXECUTION
	******************************************************************************/
	var _config$1 = {
	  title: '',
	  description: pkg.description,
	  version: pkg.version,
	  keywords: pkg.keywords.join(', '),
	  author: pkg.author.name,
	  website: 'http://npmjs.org/webpage',
	  style: 'BUNDLE/bundle.css'
	};
	function config$1(key) {
	  return key ? _config$1[key] : _config$1;
	}

	/******************************************************************************
	  DEPENDENCIES
	******************************************************************************/
	var _config = __moduleExports;
	/******************************************************************************
	  PARAMETER = ARGUMENT
	******************************************************************************/
	// no cli tool
	/******************************************************************************
	  EXPORT
	******************************************************************************/
	var index = boilerplate;
	/******************************************************************************
	  EXECUTION
	******************************************************************************/
	var config = _config();
	function boilerplate(parameter) {
	  var $title = config['title'];
	  var $description = config['description'];
	  var $keywords = config['keywords'];
	  var $author = config['author'];
	  var $website = config['website'];
	  var $style = config['style'];

	  var $logoURL = undefined;
	  var $googleAnalytics = undefined;

	  if (parameter) {
	    $title = parameter.title || $title;
	    $description = parameter.description || $description;
	    $keywords = parameter.keywords || $keywords;
	    $author = parameter.author || $author;
	    $website = parameter.website || $website;
	    $style = parameter.style || $style;

	    $logoURL = parameter.logoURL || $logoURL;
	    $googleAnalytics = parameter.ga || $googleAnalytics;
	  }

	  var title = ['<title>' + $title + '</title>'];
	  var meta = ['<meta charset="utf-8">', '<meta name="format-detection" content="telephone=no" />', '<meta name="msapplication-tap-highlight" content="no" />', '<meta name="description" content="' + $description + '">', '<meta name="keywords" content="' + $keywords + '">', '<meta name="author" content="' + $author + '">', '<meta name="viewport" content="width=device-width, initial-scale = 1.0, user-scalable=no">'];
	  var og = ['<meta property="og:title" content="' + $title + '" />', '<meta property="og:site_name" content="' + $title + '" />', '<meta property="og:url" content="' + $website + '" />', '<meta property="og:description" content="' + $description + '" />', '<meta property="og:image" content="' + $logoURL + '" />'];
	  var icon = [// check item generator
	  '<link rel="apple-touch-icon" sizes="57x57" href="logo/favicon/apple-touch-icon-57x57.png">', '<link rel="apple-touch-icon" sizes="60x60" href="logo/favicon/apple-touch-icon-60x60.png">', '<link rel="apple-touch-icon" sizes="72x72" href="logo/favicon/apple-touch-icon-72x72.png">', '<link rel="apple-touch-icon" sizes="76x76" href="logo/favicon/apple-touch-icon-76x76.png">', '<link rel="apple-touch-icon" sizes="114x114" href="logo/favicon/apple-touch-icon-114x114.png">', '<link rel="apple-touch-icon" sizes="120x120" href="logo/favicon/apple-touch-icon-120x120.png">', '<link rel="apple-touch-icon" sizes="144x144" href="logo/favicon/apple-touch-icon-144x144.png">', '<link rel="icon" type="image/png" href="logo/favicon/favicon-32x32.png" sizes="32x32">', '<link rel="icon" type="image/png" href="logo/favicon/favicon-96x96.png" sizes="96x96">', '<link rel="icon" type="image/png" href="logo/favicon/favicon-16x16.png" sizes="16x16">', '<link rel="manifest" href="logo/favicon/manifest.json">', '<meta name="msapplication-TileColor" content="#b91d47">', '<meta name="msapplication-TileImage" content="logo/favicon/mstile-144x144.png">', '<meta name="theme-color" content="#ffffff">', '<link rel="shortcut icon" type="image/x-icon" href="SOURCE/favicon.ico">', '<link rel="icon" type="image/png" href="SOURCE/reinventingengagement.png">'];
	  var style = ['<link rel="stylesheet" type="text/css" href="' + $style + '" />'];
	  var google = $googleAnalytics ? ["<script>", "(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){", "(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),", "m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)", "})(window,document,'script','//www.google-analytics.com/analytics.js','ga');", "ga('create', '" + $googleAnalytics + "', 'auto');", "ga('send', 'pageview');", "</script>"] : [];

	  var head = title.concat(meta).concat(og) /*.concat(icon)*/.concat(style);
	  var body = google /*.concat(...)*/;

	  var htmlTag = document.querySelector('html');
	  var headTag = document.querySelector('head');
	  var bodyTag = document.querySelector('body');

	  htmlTag.setAttribute('lang', 'en');
	  headTag.innerHTML = head.join('');

	  var tmp,
	      temp = document.createElement('div');
	  temp.innerHTML = body.join('');
	  while (tmp = temp.childNodes[0]) {
	    bodyTag.appendChild(tmp);
	  }

	  return bodyTag;
	};

	let excludeFlowName;
	let _i;
	let _len;

	phantom.onError = onErrorFunction.bind(undefined, phantom);
	const opts = parseOpts(phantom, process.argv.slice(2));
	console.log('process.argv', process.argv);
	console.log('opts', opts);
	const _ref = opts.hostname;
	const hostname = _ref != null ? _ref : 'localhost:54321';

	console.log(`PHANTOM: Using ${hostname}`);
	const timeoutArg = opts.timeout;
	const timeout = timeoutArg ? 1000 * parseInt(timeoutArg, 10) : 300000;

	console.log(`PHANTOM: Using timeout ${timeout}ms`);
	const packsArg = opts.packs;
	const packNames = packsArg ? packsArg.split(':') : ['examples'];
	const excludeFlowsArg = opts.excludeFlows;
	const excludeFlowsNames = excludeFlowsArg ? excludeFlowsArg.split(';') : [];

	for (_i = 0, _len = excludeFlowsNames.length; _i < _len; _i++) {
	  excludeFlowName = excludeFlowsNames[_i];
	  console.log(`PHANTOM: Excluding flow: ${excludeFlowName}`);
	}

	const page = index.create();

	if (opts.perf) {
	  console.log(`PHANTOM: Performance of individual tests will be recorded in perf.csv in output directory: ${opts.outputDir}.`);
	  page._outputDir = opts.outputDir;
	}

	page.onResourceError = onResourceError;
	page.onConsoleMessage = onConsoleMessageFunction;
	page.onCallback = onCallbackFunction.bind(undefined, page);
	page.open(`http://${hostname}/flow/index.html`, statusFunction.bind(undefined, phantom, waitFor, page, packNames, opts, hostname, excludeFlowsNames));

}));