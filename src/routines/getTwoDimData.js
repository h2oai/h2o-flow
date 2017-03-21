export function getTwoDimData(table, columnName) {
  const lodash = window._;
  const columnIndex = lodash.findIndex(table.columns, column => column.name === columnName);
  if (columnIndex >= 0) {
    return table.data[columnIndex];
  }
  return void 0;
}
