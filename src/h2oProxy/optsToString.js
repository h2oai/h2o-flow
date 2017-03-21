export function optsToString(opts) {
  let str;
  if (opts != null) {
    str = ` with opts ${JSON.stringify(opts)}`;
    if (str.length > 50) {
      return `${str.substr(0, 50)}...`;
    }
    return str;
  }
  return '';
}
