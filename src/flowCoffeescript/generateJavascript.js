export function generateJavascript(program, go) {
  const Flow = window.Flow;
  const escodegen = window.escodegen;
  let error;
  try {
    return go(null, escodegen.generate(program));
  } catch (_error) {
    error = _error;
    return go(new Flow.Error('Error generating javascript', error));
  }
}
