var hostname, page, system, waitFor, webpage, _ref;

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

hostname = (_ref = system.args[1]) != null ? _ref : 'localhost:54321';

page = webpage.create();

page.onResourceError = function(_arg) {
  var errorString, url;
  url = _arg.url, errorString = _arg.errorString;
  return console.log("BROWSER: *** RESOURCE ERROR *** " + url + ": " + errorString);
};

page.onConsoleMessage = function(message) {
  return console.log("BROWSER: " + message);
};

waitFor = function(test, onReady, timeout) {
  var condition, interval, retest, startTime;
  if (timeout == null) {
    timeout = 3600000;
  }
  startTime = new Date().getTime();
  condition = false;
  retest = function() {
    if ((new Date().getTime() - startTime < timeout) && !condition) {
      console.log('PHANTOM: PING');
      return condition = test();
    } else {
      if (condition) {
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
  var test;
  if (status === 'success') {
    test = function() {
      return page.evaluate(function() {
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
            console.log('Fetching packs...');
            return context.requestPacks(function(error, packNames) {
              var tasks;
              if (error) {
                console.log('*** ERROR *** Failed fetching packs');
                return go(error);
              } else {
                console.log('Processing packs...');
                tasks = packNames.map(function(packName) {
                  return function(go) {
                    return runPack(packName, go);
                  };
                });
                return (Flow.Async.iterate(tasks))(go);
              }
            });
          };
          runPack = function(packName, go) {
            console.log("Fetching pack: " + packName);
            return context.requestPack(packName, function(error, flowNames) {
              var tasks;
              if (error) {
                console.log('*** ERROR *** Failed fetching pack');
                return go(error);
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
            console.log("Fetching flow document: " + packName + " - " + flowName);
            return context.requestFlow(packName, flowName, function(error, flow) {
              var flowTitle, waitForFlow;
              if (error) {
                console.log('*** ERROR *** Failed fetching flow document');
                return go(error);
              } else {
                flowTitle = "" + packName + " - " + flowName;
                console.log("Opening flow " + flowTitle);
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
            if (error) {
              console.log('*** ERROR *** Error running packs: ' + JSON.stringify(error));
            } else {
              console.log('Finished running all packs!');
            }
            return window._phantom_exit_ = true;
          });
          return false;
        }
      });
    };
    return waitFor(test, function() {
      var errors;
      errors = page.evaluate(function() {
        return window._phantom_errors_;
      });
      if (errors) {
        console.log('PHANTOM: *** ERROR *** One or more flows failed to complete: ' + JSON.stringify(errors));
        return phantom.exit(1);
      } else {
        console.log('PHANTOM: Success! All flows ran to completion!');
        return phantom.exit(0);
      }
    });
  } else {
    console.log('PHANTOM: *** ERROR *** Unable to access network.');
    return phantom.exit(1);
  }
});
