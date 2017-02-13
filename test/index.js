/* global phantom */
/* eslint-disable global-require */

import printUsageAndExit from './printUsageAndExit';
import parseOpts from './parseOpts';
import onErrorFunction from './onErrorFunction';
import onResourceErrorFunction from './onResourceErrorFunction';
import waitFor from './waitFor';


let excludeFlowName;
let _i;
let _len;

const system = require('system'); // eslint-disable-line import/no-unresolved
const webpage = require('webpage'); // eslint-disable-line import/no-unresolved
phantom.onError = onErrorFunction.bind(this, phantom);
const opts = parseOpts(phantom, system.args.slice(1));
const _ref = opts.hostname;
const hostname = (_ref) != null ? _ref : 'localhost:54321';

console.log(`PHANTOM: Using ${hostname}`);
const timeoutArg = opts.timeout;
const timeout = (timeoutArg) ? 1000 * parseInt(timeoutArg, 10) : 300000;

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

page.onResourceError = onResourceErrorFunction;

page.onConsoleMessage = message => console.log(`BROWSER: ${message}`);

page.onCallback = perfLine => {
  const fs = require('fs');
  return fs.write(`${page._outputDir}/perf.csv`, perfLine, 'a');
};

page.open(`http://${hostname}/flow/index.html`, status => {
  let printErrors;
  let test;
  console.log('status from page.open', status);
  if (status === 'success') {
    test = () => {
      console.log('test function was called');
      return page.evaluate((
        packNames,
        date,
        buildId,
        gitHash,
        gitBranch,
        hostname,
        ncpu,
        os,
        jobName,
        perf,
        excludeFlowsNames
      ) => {
        let context;
        // var runPack;
        // var runPacks;
        window._date = date;
        window._buildId = buildId;
        window._gitHash = gitHash;
        window._gitBranch = gitBranch;
        window._hostname = hostname;
        window._ncpu = ncpu;
        window._os = os;
        window._jobName = jobName;
        window._perf = perf;
        window._excludeFlowsNames = excludeFlowsNames;
        // context = window.flow.context;
        if (window._phantom_started_) {
          if (window._phantom_exit_) {
            return true;
          }
          return false;
        }
      // runPacks = function(go) {
      //   var tasks;
      //   window._phantom_test_summary_ = {};
      //   tasks = packNames.map(function(packName) {
      //     return function(go) {
      //       return runPack(packName, go);
      //     };
      //   });
      //   return (Flow.Async.iterate(tasks))(go);
      // };
      // runPack = function(packName, go) {
      //   console.log("Fetching pack: " + packName + "...");
      //   return context.requestPack(packName, function(error, flowNames) {
      //     var tasks;
      //     if (error) {
      //       console.log("*** ERROR *** Failed fetching pack " + packName);
      //       return go(new Error("Failed fetching pack " + packName, error));
      //     } else {
      //       console.log('Processing pack...');
      //       tasks = flowNames.map(function(flowName) {
      //         return function(go) {
      //           return runFlow(packName, flowName, go);
      //         };
      //       });
      //       return (Flow.Async.iterate(tasks))(go);
      //     }
      //   });
      // };
        const runFlow = (packName, flowName, go) => {
          console.log('runFlow was called');
          let flowTitle;
          const doFlow = (flowName, excludeFlowsNames) => {
            let f;
            let _j;
            let _len1;
            for (_j = 0, _len1 = excludeFlowsNames.length; _j < _len1; _j++) {
              f = excludeFlowsNames[_j];
              if (flowName === f) {
                return false;
              }
            }
            return true;
          };
          if (doFlow(flowName, window._excludeFlowsNames)) {
            flowTitle = `${packName} - ${flowName}`;
            window._phantom_test_summary_[flowTitle] = 'FAILED';
            console.log(`Fetching flow document: ${packName} - ${flowName}...`);
            return context.requestFlow(packName, flowName, (error, flow) => {
              let waitForFlow;
              if (error) {
                console.log(`*** ERROR *** Failed fetching flow ${flowTitle}`);
                go(new Error(`Failed fetching flow ${flowTitle}`, error));
              } else {
                console.log(`Opening flow ${flowTitle}...`);
                window._phantom_running_ = true;
                context.open(flowTitle, flow);
                waitForFlow = () => {
                  if (window._phantom_running_) {
                    console.log('ACK');
                    return setTimeout(waitForFlow, 2000);
                  }
                  console.log('Flow completed!');
                  const errors = window._phantom_errors_;
                  return context.requestRemoveAll(() => go(errors));
                };
                console.log('Running flow...');
                window._startTime = new Date().getTime() / 1000;
                context.executeAllCells(true, (status, errors) => {
                  window._endTime = new Date().getTime() / 1000;
                  console.log(`Flow finished with status: ${status}`);
                  if (status === 'failed') {
                    window._pass = 0;
                    window._phantom_errors_ = errors;
                  } else {
                    window._pass = 1;
                    window._phantom_test_summary_[flowTitle] = 'PASSED';
                  }
                  if (window._perf) {
                    window.callPhantom(`${window._date}, ${window._buildId}, ${window._gitHash}, ${window._gitBranch}, ${window._hostname}, ${flowName}, ${window._startTime}, ${window._endTime}, ${window._pass}, ${window._ncpu}, ${window._os}, ${window._jobName}\n`);
                  }
                  window._phantom_running_ = false;
                  return window._phantom_running_;
                });
              }
              return setTimeout(waitForFlow, 2000);
            });
          }
          console.log(`Ignoring flow: ${flowName}`);
          return go(null);
        };
        console.log('Starting tests...');
        window._phantom_errors_ = null;
        window._phantom_started_ = true;
      // runPacks(function(error) {
      //   var _ref1;
      //   if (error) {
      //     console.log('*** ERROR *** Error running packs');
      //     window._phantom_errors_ = (_ref1 = error.message) != null ? _ref1 : error;
      //   } else {
      //     console.log('Finished running all packs!');
      //   }
      //   return window._phantom_exit_ = true;
      // });
        return false;
      },
      packNames,
      opts.date,
      opts.buildId,
      opts.gitHash,
      opts.gitBranch,
      hostname,
      opts.ncpu,
      opts.os,
      opts.jobName,
      opts.perf,
      excludeFlowsNames
    );
    };
    printErrors = (errors, prefix) => {
      let error;
      if (prefix == null) {
        prefix = '';
      }
      if (errors) {
        if (Array.isArray(errors)) {
          return (((() => {
            let _j;
            let _len1;
            const _results = [];
            for (_j = 0, _len1 = errors.length; _j < _len1; _j++) {
              error = errors[_j];
              _results.push(printErrors(error, `${prefix}  `));
            }
            return _results;
          }))()).join('\n');
        } else if (errors.message) {
          if (errors.cause) {
            return `${errors.message}\n${printErrors(errors.cause, prefix + '  ')}`; // eslint-disable-line prefer-template
          }
          return errors.message;
        }
        return errors;
      }
      return errors;
    };
    return waitFor(phantom, test, () => {
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
});
