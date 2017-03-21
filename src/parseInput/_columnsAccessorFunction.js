export function _columnsAccessorFunction(preview) {
  const Flow = window.Flow;
  let data;
  let i;
  let j;
  let row;
  let _i;
  let _j;
  const columnTypes = preview.column_types;
  const columnCount = columnTypes.length;
  const previewData = preview.data;
  const rowCount = previewData.length;
  const columnNames = preview.column_names;
  const rows = new Array(columnCount);
  for (j = _i = 0; columnCount >= 0 ? _i < columnCount : _i > columnCount; j = columnCount >= 0 ? ++_i : --_i) {
    data = new Array(rowCount);
    for (i = _j = 0; rowCount >= 0 ? _j < rowCount : _j > rowCount; i = rowCount >= 0 ? ++_j : --_j) {
      data[i] = previewData[i][j];
    }
    rows[j] = row = {
      index: `${(j + 1)}`,
      name: Flow.Dataflow.signal(columnNames ? columnNames[j] : ''),
      type: Flow.Dataflow.signal(columnTypes[j]),
      data,
    };
  }
  return rows;
}
