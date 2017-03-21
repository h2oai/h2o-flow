export function compileJavascript(js, go) {
  const Flow = window.Flow;
  let closure;
  let error;
  try {
      closure = new Function('h2o', '_h2o_context_', '_h2o_results_', 'print', js); // eslint-disable-line
    return go(null, closure);
  } catch (_error) {
    error = _error;
    return go(new Flow.Error('Error compiling javascript', error));
  }
}
