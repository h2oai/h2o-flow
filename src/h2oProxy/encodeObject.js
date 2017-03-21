export function encodeObject(source) {
  let k;
  let v;
  const target = {};
  for (k in source) {
    if ({}.hasOwnProperty.call(source, k)) {
      v = source[k];
      target[k] = encodeURIComponent(v);
    }
  }
  return target;
}
