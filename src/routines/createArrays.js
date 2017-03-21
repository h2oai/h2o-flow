export function createArrays(count, length) {
  let i;
  let _i;
  const _results = [];
  for (i = _i = 0; count >= 0 ? _i < count : _i > count; i = count >= 0 ? ++_i : --_i) {
    _results.push(new Array(length));
  }
  return _results;
}
