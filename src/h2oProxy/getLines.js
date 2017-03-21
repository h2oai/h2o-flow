export function getLines(data) {
  const lodash = window._;
  return lodash.filter(data.split('\n'), line => {
    if (line.trim()) {
      return true;
    }
    return false;
  });
}
