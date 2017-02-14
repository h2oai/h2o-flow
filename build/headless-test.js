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

  let excludeFlowName;
  let _i;
  let _len;

  const system = require('system'); // eslint-disable-line import/no-unresolved
  const webpage = require('webpage'); // eslint-disable-line import/no-unresolved
  phantom.onError = onErrorFunction.bind(undefined, phantom);
  const opts = parseOpts(phantom, system.args.slice(1));
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

  const page = webpage.create();

  if (opts.perf) {
    console.log(`PHANTOM: Performance of individual tests will be recorded in perf.csv in output directory: ${opts.outputDir}.`);
    page._outputDir = opts.outputDir;
  }

  page.onResourceError = onResourceError;
  page.onConsoleMessage = onConsoleMessageFunction;
  page.onCallback = onCallbackFunction.bind(undefined, page);
  page.open(`http://${hostname}/flow/index.html`, statusFunction.bind(undefined, phantom, waitFor, page, packNames, opts, hostname, excludeFlowsNames));

}));