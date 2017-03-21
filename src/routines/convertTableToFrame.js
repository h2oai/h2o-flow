import { convertColumnToVector } from './convertColumnToVector';

export function convertTableToFrame(table, tableName, metadata) {
  const lodash = window._;

  const lightning = (typeof window !== 'undefined' && window !== null ? window.plot : void 0) != null ? window.plot : {};
  if (lightning.settings) {
    lightning.settings.axisLabelFont = '11px "Source Code Pro", monospace';
    lightning.settings.axisTitleFont = 'bold 11px "Source Code Pro", monospace';
  }

  const createDataframe = lightning.createFrame;

  // TODO handle format strings and description
  let column;
  let i;
  const vectors = (() => {
    let _i;
    let _len;
    const _ref = table.columns;
    const _results = [];
    for (i = _i = 0, _len = _ref.length; _i < _len; i = ++_i) {
      column = _ref[i];
      _results.push(convertColumnToVector(column, table.data[i]));
    }
    return _results;
  })();
  return createDataframe(tableName, vectors, lodash.range(table.rowcount), null, metadata);
}
