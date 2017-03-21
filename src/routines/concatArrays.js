export function concatArrays(arrays) {
  const lodash = window._;
  let a;
  switch (arrays.length) {
    case 0:
      return [];
    case 1:
      return lodash.head(arrays);
    default:
      a = lodash.head(arrays);
      return a.concat(...lodash.tail(arrays));
  }
}
