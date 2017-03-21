export function parseNumbers(source) {
  let i;
  let value;
  let _i;
  let _len;
  const target = new Array(source.length);
  for (i = _i = 0, _len = source.length; _i < _len; i = ++_i) {
    value = source[i];
    // TODO handle formatting
    target[i] = value === 'NaN' ? void 0 : value === 'Infinity' ? Number.POSITIVE_INFINITY : value === '-Infinity' ? Number.NEGATIVE_INFINITY : value;
  }
  return target;
}
