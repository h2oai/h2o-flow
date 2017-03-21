export function executeJavascript(sandbox, print) {
  const Flow = window.Flow;
  return (closure, go) => {
    console.log('sandbox from executeJavascript', sandbox);
    let error;
    try {
      return go(null, closure(sandbox.routines, sandbox.context, sandbox.results, print));
    } catch (_error) {
      error = _error;
      return go(new Flow.Error('Error executing javascript', error));
    }
  };
}
