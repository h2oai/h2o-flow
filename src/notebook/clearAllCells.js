export default function clearAllCells(_) {
  let cell;
  let _i;
  let _len;
  const _ref = _.cells();
  for (_i = 0, _len = _ref.length; _i < _len; _i++) {
    cell = _ref[_i];
    cell.clear();
    cell.autoResize();
  }
}
