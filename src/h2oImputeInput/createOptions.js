export function createOptions(options) {
  let option;
  let _i;
  let _len;
  const _results = [];
  for (_i = 0, _len = options.length; _i < _len; _i++) {
    option = options[_i];
    _results.push({
      caption: option,
      value: option.toLowerCase(),
    });
  }
  return _results;
}
