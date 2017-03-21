export function findColumnIndexByColumnLabel(frame, columnLabel) {
  const Flow = window.Flow;
  let column;
  let i;
  let _i;
  let _len;
  const _ref1 = frame.columns;
  for (i = _i = 0, _len = _ref1.length; _i < _len; i = ++_i) {
    column = _ref1[i];
    if (column.label === columnLabel) {
      return i;
    }
  }
  throw new Flow.Error(`Column [${columnLabel}] not found in frame`);
}
