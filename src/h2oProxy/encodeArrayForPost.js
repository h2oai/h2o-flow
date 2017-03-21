export function encodeArrayForPost(array) {
  const lodash = window._;
  if (array) {
    if (array.length === 0) {
      return null;
    }
    return `[${lodash.map(array, element => { if (lodash.isNumber(element)) { return element; } return `"${element}"`; }).join(',')} ]`;
  }
  return null;
}
