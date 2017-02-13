import printUsageAndExit from './printUsageAndExit';
import parseOpts from './parseOpts';
import onErrorFunction from './onErrorFunction';

var excludeFlowName;
var excludeFlowsArg;
var excludeFlowsNames;
var hostname;
var opts;
var packNames;
var packsArg;
var page;
var parseOpts;
var printUsageAndExit;
var system;
var timeout;
var timeoutArg;
var waitFor;
var webpage;
var _i;
var _len;
var _ref;

system = require('system');
webpage = require('webpage');
phantom.onError = onErrorFunction.bind(this, phantom);
opts = parseOpts(phantom, system.args.slice(1));
hostname = (_ref = opts['hostname']) != null ? _ref : 'localhost:54321';

console.log("PHANTOM: Using " + hostname);
timeout = (timeoutArg = opts['timeout']) ? 1000 * parseInt(timeoutArg, 10) : 300000;

console.log("PHANTOM: Using timeout " + timeout + "ms");
packsArg = opts['packs'];
packNames = packsArg ? packsArg.split(':') : ['examples'];
excludeFlowsArg = opts['excludeFlows'];
excludeFlowsNames = excludeFlowsArg ? excludeFlowsArg.split(';') : [];

for (_i = 0, _len = excludeFlowsNames.length; _i < _len; _i++) {
  excludeFlowName = excludeFlowsNames[_i];
  console.log("PHANTOM: Excluding flow: " + excludeFlowName);
}

page = webpage.create();

if (opts['perf']) {
  console.log("PHANTOM: Performance of individual tests will be recorded in perf.csv in output directory: " + opts['outputDir'] + ".");
  page._outputDir = opts['outputDir'];
}

page.onResourceError = _arg => {
  var errorString;
  var url;
  url = _arg.url, errorString = _arg.errorString;
  return console.log("BROWSER: *** RESOURCE ERROR *** " + url + ": " + errorString);
};

page.onConsoleMessage = message => console.log("BROWSER: " + message);

page.onCallback = perfLine => {
  var fs;
  fs = require('fs');
  return fs.write(page._outputDir + '/perf.csv', perfLine, 'a');
};

waitFor = (test, onReady) => {
  var interval;
  var isComplete;
  var retest;
  var startTime;
  startTime = new Date().getTime();
  isComplete = false;
  retest = () => {
    if ((new Date().getTime() - startTime < timeout) && !isComplete) {
      console.log('PHANTOM: PING');
      return isComplete = test();
    } else {
      if (isComplete) {
        onReady();
        return clearInterval(interval);
      } else {
        console.log('PHANTOM: *** ERROR *** Timeout Exceeded');
        return phantom.exit(1);
      }
    }
  };
  return interval = setInterval(retest, 2000);
};

page.open("http://" + hostname + "/flow/index.html", status => {
  var printErrors;
  var test;
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
        var context;
        var runFlow;
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
          } else {
            return false;
          }
        } else {
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
          runFlow = (packName, flowName, go) => {
            console.log('runFlow was called');
            var doFlow;
            var flowTitle;
            doFlow = (flowName, excludeFlowsNames) => {
              var f;
              var _j;
              var _len1;
              for (_j = 0, _len1 = excludeFlowsNames.length; _j < _len1; _j++) {
                f = excludeFlowsNames[_j];
                if (flowName === f) {
                  return false;
                }
              }
              return true;
            };
            if (doFlow(flowName, window._excludeFlowsNames)) {
              flowTitle = "" + packName + " - " + flowName;
              window._phantom_test_summary_[flowTitle] = 'FAILED';
              console.log("Fetching flow document: " + packName + " - " + flowName + "...");
              return context.requestFlow(packName, flowName, (error, flow) => {
                var waitForFlow;
                if (error) {
                  console.log("*** ERROR *** Failed fetching flow " + flowTitle);
                  go(new Error("Failed fetching flow " + flowTitle, error));
                } else {
                  console.log("Opening flow " + flowTitle + "...");
                  window._phantom_running_ = true;
                  context.open(flowTitle, flow);
                  waitForFlow = () => {
                    var errors;
                    if (window._phantom_running_) {
                      console.log('ACK');
                      return setTimeout(waitForFlow, 2000);
                    } else {
                      console.log('Flow completed!');
                      errors = window._phantom_errors_;
                      return context.requestRemoveAll(() => go(errors ? errors : null));
                    }
                  };
                  console.log('Running flow...');
                  window._startTime = new Date().getTime() / 1000;
                  context.executeAllCells(true, (status, errors) => {
                    window._endTime = new Date().getTime() / 1000;
                    console.log("Flow finished with status: " + status);
                    if (status === 'failed') {
                      window._pass = 0;
                      window._phantom_errors_ = errors;
                    } else {
                      window._pass = 1;
                      window._phantom_test_summary_[flowTitle] = 'PASSED';
                    }
                    if (window._perf) {
                      window.callPhantom("" + window._date + ", " + window._buildId + ", " + window._gitHash + ", " + window._gitBranch + ", " + window._hostname + ", " + flowName + ", " + window._startTime + ", " + window._endTime + ", " + window._pass + ", " + window._ncpu + ", " + window._os + ", " + window._jobName + "\n");
                    }
                    return window._phantom_running_ = false;
                  });
                }
                return setTimeout(waitForFlow, 2000);
              });
            } else {
              console.log("Ignoring flow: " + flowName);
              return go(null);
            }
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
        }
      }, packNames, opts['date'], opts['buildId'], opts['gitHash'], opts['gitBranch'], hostname, opts['ncpu'], opts['os'], opts['jobName'], opts['perf'], excludeFlowsNames);
    };
    printErrors = (errors, prefix) => {
      var error;
      if (prefix == null) {
        prefix = '';
      }
      if (errors) {
        if (Array.isArray(errors)) {
          return (((() => {
            var _j;
            var _len1;
            var _results;
            _results = [];
            for (_j = 0, _len1 = errors.length; _j < _len1; _j++) {
              error = errors[_j];
              _results.push(printErrors(error, prefix + '  '));
            }
            return _results;
          }))()).join('\n');
        } else if (errors.message) {
          if (errors.cause) {
            return errors.message + '\n' + printErrors(errors.cause, prefix + '  ');
          } else {
            return errors.message;
          }
        } else {
          return errors;
        }
      } else {
        return errors;
      }
    };
    return waitFor(test, () => {
      var errors;
      var flowTitle;
      var summary;
      var testCount;
      var testStatus;
      errors = page.evaluate(() => window._phantom_errors_);
      if (errors) {
        console.log('------------------ FAILED -------------------');
        console.log(printErrors(errors));
        console.log('---------------------------------------------');
        return phantom.exit(1);
      } else {
        summary = page.evaluate(() => window._phantom_test_summary_);
        console.log('------------------ PASSED -------------------');
        testCount = 0;
        for (flowTitle in summary) {
          testStatus = summary[flowTitle];
          console.log("" + testStatus + ": " + flowTitle);
          testCount++;
        }
        console.log("(" + testCount + " tests executed.)");
        console.log('---------------------------------------------');
        return phantom.exit(0);
      }
    });
  } else {
    console.log('PHANTOM: *** ERROR *** Unable to access network.');
    return phantom.exit(1);
  }
});
