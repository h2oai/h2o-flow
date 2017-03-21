// redefine scope by coalescing down to non-local identifiers
export function coalesceScopes(scopes) {
  let i;
  let identifier;
  let name;
  let scope;
  let _i;
  let _len;
  const currentScope = {};
  for (i = _i = 0, _len = scopes.length; _i < _len; i = ++_i) {
    scope = scopes[i];
    if (i === 0) {
      for (name in scope) {
        if ({}.hasOwnProperty.call(scope, name)) {
          identifier = scope[name];
          currentScope[name] = identifier;
        }
      }
    } else {
      for (name in scope) {
        if ({}.hasOwnProperty.call(scope, name)) {
          identifier = scope[name];
          currentScope[name] = null;
        }
      }
    }
  }
  return currentScope;
}
