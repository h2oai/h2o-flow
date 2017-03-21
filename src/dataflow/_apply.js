export function _apply(sources, func) {
  const lodash = window._;
  return func(...lodash.map(sources, source => source()));
}
