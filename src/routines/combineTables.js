export function combineTables(tables) {
  const lodash = window._;
  let columnData;
  let element;
  let i;
  let index;
  let rowCount;
  let table;
  let _i;
  let _j;
  let _k;
  let _l;
  let _len;
  let _len1;
  let _len2;
  let _ref;
  const leader = lodash.head(tables);
  rowCount = 0;
  const columnCount = leader.data.length;
  const data = new Array(columnCount);
  for (_i = 0, _len = tables.length; _i < _len; _i++) {
    table = tables[_i];
    rowCount += table.rowcount;
  }
  for (i = _j = 0; columnCount >= 0 ? _j < columnCount : _j > columnCount; i = columnCount >= 0 ? ++_j : --_j) {
    data[i] = columnData = new Array(rowCount);
    index = 0;
    for (_k = 0, _len1 = tables.length; _k < _len1; _k++) {
      table = tables[_k];
      _ref = table.data[i];
      for (_l = 0, _len2 = _ref.length; _l < _len2; _l++) {
        element = _ref[_l];
        columnData[index++] = element;
      }
    }
  }
  return {
    name: leader.name,
    columns: leader.columns,
    data,
    rowcount: rowCount,
  };
}
