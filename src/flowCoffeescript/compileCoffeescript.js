export function compileCoffeescript(cs, go) {
  const Flow = window.Flow;
  const CoffeeScript = window.CoffeeScript;
  let error;
  try {
    return go(null, CoffeeScript.compile(cs, { bare: true }));
  } catch (_error) {
    error = _error;
    return go(new Flow.Error('Error compiling coffee-script', error));
  }
}
