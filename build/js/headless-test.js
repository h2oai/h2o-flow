var excludeFlowName, excludeFlowsArg, excludeFlowsNames, hostname, opts, packNames, packsArg, page, parseOpts, printUsageAndExit, system, timeout, timeoutArg, waitFor, webpage, _i, _len, _ref;

system = require('system');

webpage = require('webpage');

phantom.onError = function(message, stacktrace) {
  var stack, t;
  if (stacktrace != null ? stacktrace.length : void 0) {
    stack = (function() {
      var _i, _len, _results;
      _results = [];
      for (_i = 0, _len = stacktrace.length; _i < _len; _i++) {
        t = stacktrace[_i];
        _results.push(' -> ' + (t.file || t.sourceURL) + ': ' + t.line + (t["function"] ? ' (in function ' + t["function"] + ')' : ''));
      }
      return _results;
    })();
    console.log(("PHANTOM: *** ERROR *** " + message + "\n") + stack.join('\n'));
    return phantom.exit(1);
  }
};

printUsageAndExit = function(message) {
  console.log("*** " + message + " ***");
  console.log('Usage: phantomjs headless-test.js [--host ip:port] [--timeout seconds] [--packs foo:bar:baz] [--perf date buildId gitHash gitBranch ncpu os jobName outputDir] [--excludeFlows flow1;flow2]');
  console.log('    ip:port      defaults to localhost:54321');
  console.log('    timeout      defaults to 3600');
  console.log('    packs        defaults to examples');
  console.log('    perf         performance of individual tests will be recorded in perf.csv in the output directory');
  console.log('    excludeFlows do not run these flows');
  return phantom.exit(1);
};

parseOpts = function(args) {
  var i, opts;
  console.log("Using args " + (args.join(' ')));
  i = 0;
  opts = {};
  while (i < args.length) {
    if (args[i] === "--host") {
      i = i + 1;
      if (i > args.length) {
        printUsageAndExit("Unknown argument: " + args[i]);
      }
      opts['hostname'] = args[i];
    } else if (args[i] === "--timeout") {
      i = i + 1;
      if (i > args.length) {
        printUsageAndExit("Unknown argument: " + args[i]);
      }
      opts['timeout'] = args[i];
    } else if (args[i] === "--packs") {
      i = i + 1;
      if (i > args.length) {
        printUsageAndExit("Unknown argument: " + args[i]);
      }
      opts['packs'] = args[i];
    } else if (args[i] === "--perf") {
      opts['perf'] = true;
      i = i + 1;
      if (i > args.length) {
        printUsageAndExit("Unknown argument: " + args[i]);
      }
      opts['date'] = args[i];
      i = i + 1;
      if (i > args.length) {
        printUsageAndExit("Unknown argument: " + args[i]);
      }
      opts['buildId'] = args[i];
      i = i + 1;
      if (i > args.length) {
        printUsageAndExit("Unknown argument: " + args[i]);
      }
      opts['gitHash'] = args[i];
      i = i + 1;
      if (i > args.length) {
        printUsageAndExit("Unknown argument: " + args[i]);
      }
      opts['gitBranch'] = args[i];
      i = i + 1;
      if (i > args.length) {
        printUsageAndExit("Unknown argument: " + args[i]);
      }
      opts['ncpu'] = args[i];
      i = i + 1;
      if (i > args.length) {
        printUsageAndExit("Unknown argument: " + args[i]);
      }
      opts['os'] = args[i];
      i = i + 1;
      if (i > args.length) {
        printUsageAndExit("Unknown argument: " + args[i]);
      }
      opts['jobName'] = args[i];
      i = i + 1;
      if (i > args.length) {
        printUsageAndExit("Unknown argument: " + args[i]);
      }
      opts['outputDir'] = args[i];
    } else if (args[i] === "--excludeFlows") {
      i = i + 1;
      if (i > args.length) {
        printUsageAndExit("Unknown argument: " + args[i]);
      }
      opts['excludeFlows'] = args[i];
    } else {
      printUsageAndExit("Unknown argument: " + args[i]);
    }
    i = i + 1;
  }
  return opts;
};

opts = parseOpts(system.args.slice(1));

hostname = (_ref = opts['hostname']) != null ? _ref : 'localhost:54321';

console.log("PHANTOM: Using " + hostname);

timeout = (timeoutArg = opts['timeout']) ? 1000 * parseInt(timeoutArg, 10) : 3600000;

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

page.onResourceError = function(_arg) {
  var errorString, url;
  url = _arg.url, errorString = _arg.errorString;
  return console.log("BROWSER: *** RESOURCE ERROR *** " + url + ": " + errorString);
};

page.onConsoleMessage = function(message) {
  return console.log("BROWSER: " + message);
};

page.onCallback = function(perfLine) {
  var fs;
  fs = require('fs');
  return fs.write(page._outputDir + '/perf.csv', perfLine, 'a');
};

waitFor = function(test, onReady) {
  var interval, isComplete, retest, startTime;
  startTime = new Date().getTime();
  isComplete = false;
  retest = function() {
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

page.open("http://" + hostname + "/flow/index.html", function(status) {
  var printErrors, test;
  if (status === 'success') {
    test = function() {
      return page.evaluate(function(packNames, date, buildId, gitHash, gitBranch, hostname, ncpu, os, jobName, perf, excludeFlowsNames) {
        var context, runFlow, runPack, runPacks;
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
        context = window.flow.context;
        if (window._phantom_started_) {
          if (window._phantom_exit_) {
            return true;
          } else {
            return false;
          }
        } else {
          runPacks = function(go) {
            var tasks;
            window._phantom_test_summary_ = {};
            tasks = packNames.map(function(packName) {
              return function(go) {
                return runPack(packName, go);
              };
            });
            return (Flow.Async.iterate(tasks))(go);
          };
          runPack = function(packName, go) {
            console.log("Fetching pack: " + packName + "...");
            return context.requestPack(packName, function(error, flowNames) {
              var tasks;
              if (error) {
                console.log("*** ERROR *** Failed fetching pack " + packName);
                return go(new Error("Failed fetching pack " + packName, error));
              } else {
                console.log('Processing pack...');
                tasks = flowNames.map(function(flowName) {
                  return function(go) {
                    return runFlow(packName, flowName, go);
                  };
                });
                return (Flow.Async.iterate(tasks))(go);
              }
            });
          };
          runFlow = function(packName, flowName, go) {
            var doFlow, flowTitle;
            doFlow = function(flowName, excludeFlowsNames) {
              var f, _j, _len1;
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
              return context.requestFlow(packName, flowName, function(error, flow) {
                var waitForFlow;
                if (error) {
                  console.log("*** ERROR *** Failed fetching flow " + flowTitle);
                  go(new Error("Failed fetching flow " + flowTitle, error));
                } else {
                  console.log("Opening flow " + flowTitle + "...");
                  window._phantom_running_ = true;
                  context.open(flowTitle, flow);
                  waitForFlow = function() {
                    var errors;
                    if (window._phantom_running_) {
                      console.log('ACK');
                      return setTimeout(waitForFlow, 2000);
                    } else {
                      console.log('Flow completed!');
                      errors = window._phantom_errors_;
                      return context.requestRemoveAll(function() {
                        return go(errors ? errors : null);
                      });
                    }
                  };
                  console.log('Running flow...');
                  window._startTime = new Date().getTime() / 1000;
                  context.executeAllCells(true, function(status, errors) {
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
          runPacks(function(error) {
            var _ref1;
            if (error) {
              console.log('*** ERROR *** Error running packs');
              window._phantom_errors_ = (_ref1 = error.message) != null ? _ref1 : error;
            } else {
              console.log('Finished running all packs!');
            }
            return window._phantom_exit_ = true;
          });
          return false;
        }
      }, packNames, opts['date'], opts['buildId'], opts['gitHash'], opts['gitBranch'], hostname, opts['ncpu'], opts['os'], opts['jobName'], opts['perf'], excludeFlowsNames);
    };
    printErrors = function(errors, prefix) {
      var error;
      if (prefix == null) {
        prefix = '';
      }
      if (errors) {
        if (Array.isArray(errors)) {
          return ((function() {
            var _j, _len1, _results;
            _results = [];
            for (_j = 0, _len1 = errors.length; _j < _len1; _j++) {
              error = errors[_j];
              _results.push(printErrors(error, prefix + '  '));
            }
            return _results;
          })()).join('\n');
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
    return waitFor(test, function() {
      var errors, flowTitle, summary, testCount, testStatus;
      errors = page.evaluate(function() {
        return window._phantom_errors_;
      });
      if (errors) {
        console.log('------------------ FAILED -------------------');
        console.log(printErrors(errors));
        console.log('---------------------------------------------');
        return phantom.exit(1);
      } else {
        summary = page.evaluate(function() {
          return window._phantom_test_summary_;
        });
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