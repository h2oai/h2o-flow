var hostname, opts, packNames, packsArg, page, parseOpts, printUsageAndExit, system, timeout, timeoutArg, waitFor, webpage, _ref;

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
  console.log('Usage: phantomjs headless-test.js [--host ip:port] [--timeout seconds] --pack foo [--pack bar ...]');
  console.log('    ip:port  defaults to localhost:54321');
  console.log('    timeout  defaults to 3600');
  return phantom.exit(1);
};

parseOpts = function(args) {
  var i, key, opts, previous, value, _i, _len;
  if (args.length % 2 === 1) {
    printUsageAndExit('Expected even number of command line arguments');
  }
  opts = {};
  for (i = _i = 0, _len = args.length; _i < _len; i = ++_i) {
    key = args[i];
    if (!(i % 2 === 0)) {
      continue;
    }
    if (key.slice(0, 2) !== '--') {
      return printUsageAndExit("Expected keyword. Found " + key);
    }
    value = args[i + 1];
    if (key in opts) {
      previous = opts[key];
      if (Array.isArray(previous)) {
        previous.push(value);
      } else {
        opts[key] = [previous, value];
      }
    } else {
      opts[key] = value;
    }
  }
  return opts;
};

opts = parseOpts(system.args.slice(1));

hostname = (_ref = opts['--host']) != null ? _ref : 'localhost:54321';

console.log("PHANTOM: Using " + hostname);

timeout = (timeoutArg = opts['--timeout']) ? 1000 * parseInt(timeoutArg, 10) : 3600000;

packsArg = opts['--pack'];

packNames = packsArg ? Array.isArray(packsArg) ? packsArg : [packsArg] : [];

console.log("PHANTOM: Timeout set to " + timeout + "ms");

page = webpage.create();

page.onResourceError = function(_arg) {
  var errorString, url;
  url = _arg.url, errorString = _arg.errorString;
  return console.log("BROWSER: *** RESOURCE ERROR *** " + url + ": " + errorString);
};

page.onConsoleMessage = function(message) {
  return console.log("BROWSER: " + message);
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
      return page.evaluate(function(packNames) {
        var context, runFlow, runPack, runPacks;
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
            var flowTitle;
            flowTitle = "" + packName + " - " + flowName;
            window._phantom_test_summary_[flowTitle] = 'FAILED';
            console.log("Fetching flow document: " + packName + " - " + flowName + "...");
            return context.requestFlow(packName, flowName, function(error, flow) {
              var waitForFlow;
              if (error) {
                console.log("*** ERROR *** Failed fetching flow " + flowTitle);
                return go(new Error("Failed fetching flow " + flowTitle, error));
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
                context.executeAllCells(true, function(status, errors) {
                  console.log("Flow finished with status: " + status);
                  if (status === 'failed') {
                    window._phantom_errors_ = errors;
                  } else {
                    window._phantom_test_summary_[flowTitle] = 'PASSED';
                  }
                  return window._phantom_running_ = false;
                });
                return setTimeout(waitForFlow, 2000);
              }
            });
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
      }, packNames);
    };
    printErrors = function(errors, prefix) {
      var error;
      if (prefix == null) {
        prefix = '';
      }
      if (errors) {
        if (Array.isArray(errors)) {
          return ((function() {
            var _i, _len, _results;
            _results = [];
            for (_i = 0, _len = errors.length; _i < _len; _i++) {
              error = errors[_i];
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
