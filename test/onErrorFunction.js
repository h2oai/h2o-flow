export default function onErrorFunction(phantom, message, stacktrace) {
  console.log('phantom.onError was called');
  let stack;
  let t;
  if (stacktrace != null ? stacktrace.length : void 0) {
    stack = ((() => {
      let _i;
      let _len;
      const _results = [];
      for (_i = 0, _len = stacktrace.length; _i < _len; _i++) {
        t = stacktrace[_i];
        _results.push(` -> ${t.file || t.sourceURL}: ${t.line}${t['function'] ? ' (in function ' + t['function'] + ')' : ''}`); // eslint-disable-line
      }
      return _results;
    }))();
    console.log(`PHANTOM: *** ERROR *** ${message}\n${stack.join('\n')}`);
    return phantom.exit(1);
  }
}
