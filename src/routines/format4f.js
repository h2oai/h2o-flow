export function format4f(number) {
  if (number) {
    if (number === 'NaN') {
      return void 0;
    }
    return number.toFixed(4).replace(/\.0+$/, '.0');
  }
  return number;
}
