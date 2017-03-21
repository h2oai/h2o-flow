export function createGlobalScope(rootScope, routines) {
  let identifier;
  let name;
  const globalScope = {};
  for (name in rootScope) {
    if ({}.hasOwnProperty.call(rootScope, name)) {
      identifier = rootScope[name];
      globalScope[name] = identifier;
    }
  }
  for (name in routines) {
    if ({}.hasOwnProperty.call(routines, name)) {
      globalScope[name] = {
        name,
        object: 'h2o',
      };
    }
  }
  return globalScope;
}
