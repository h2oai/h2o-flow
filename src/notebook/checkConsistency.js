export function checkConsistency(_cells) {
  let cell;
  let i;
  let selectionCount;
  let _i;
  let _len;
  selectionCount = 0;
  const _ref = _cells();
  for (i = _i = 0, _len = _ref.length; _i < _len; i = ++_i) {
    cell = _ref[i];
    if (!cell) {
      console.error(`index ${i} is empty`);
    } else {
      if (cell.isSelected()) {
        selectionCount++;
      }
    }
  }
  if (selectionCount !== 1) {
    console.error(`selected cell count = ${selectionCount}`);
  }
}
