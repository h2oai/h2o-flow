export function format6fi(number) {
  if (number) {
    if (number === 'NaN') {
      return void 0;
    }
    return number.toFixed(6).replace(/\.0+$/, '');
  }
  return number;
}
