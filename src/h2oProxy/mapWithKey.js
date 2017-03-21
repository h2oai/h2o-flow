export function mapWithKey(obj, f) {
  let key;
  let value;
  const result = [];
  for (key in obj) {
    if ({}.hasOwnProperty.call(obj, key)) {
      value = obj[key];
      result.push(f(value, key));
    }
  }
  return result;
}
