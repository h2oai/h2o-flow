export function _link(source, func) {
  const lodash = window._;
  console.assert(lodash.isFunction(source, '[signal] is not a function'));
  console.assert(lodash.isFunction(source.subscribe, '[signal] does not have a [dispose] method'));
  console.assert(lodash.isFunction(func, '[func] is not a function'));
  return source.subscribe(func);
}
