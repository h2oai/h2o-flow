export function repeatValues(count, value) {
  let i;
  let _i;
  const target = new Array(count);
  for (i = _i = 0; count >= 0 ? _i < count : _i > count; i = count >= 0 ? ++_i : --_i) {
    target[i] = value;
  }
  return target;
}
