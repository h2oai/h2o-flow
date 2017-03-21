export function serialize(_) {
  let cell;
  const cells = (() => {
    let _i;
    let _len;
    const _ref = _.cells();
    const _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      cell = _ref[_i];
      _results.push({
        type: cell.type(),
        input: cell.input(),
      });
    }
    return _results;
  })();
  return {
    version: '1.0.0',
    cells,
  };
}
