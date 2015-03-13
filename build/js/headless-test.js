var hostname, page, system, _ref;

system = require('system');

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
    console.error(("ERROR: " + message + "\n") + stack.join('\n'));
    return phantom.exit(1);
  }
};

hostname = (_ref = system.args[1]) != null ? _ref : 'localhost:54321';

page = (require('webpage')).create();

page.onResourceError = function(_arg) {
  var errorString, url;
  url = _arg.url, errorString = _arg.errorString;
  return console.error("ERROR: " + url + ": " + errorString);
};

page.onConsoleMessage = function(message) {
  return console.log(message);
};

page.open("http://" + hostname + "/flow/index.html", function(status) {
  if (status === 'success') {
    page.evaluate(function() {
      var k, v, _ref1;
      _ref1 = window.flow.context;
      for (k in _ref1) {
        v = _ref1[k];
        console.log(k);
      }
    });
    return phantom.exit(0);
  } else {
    return phantom.exit(1);
  }
});
