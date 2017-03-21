export function parseJavascript(js, go) {
  const Flow = window.Flow;
  const esprima = window.esprima;
  let error;
  try {
    return go(null, esprima.parse(js));
  } catch (_error) {
    error = _error;
    return go(new Flow.Error('Error parsing javascript expression', error));
  }
}
