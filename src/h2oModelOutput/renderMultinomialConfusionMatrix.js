import { format4f } from '../routines/format4f';

export default function renderMultinomialConfusionMatrix(_, title, cm) {
  const lodash = window._;
  const Flow = window.Flow;
  let cell;
  let cells;
  let column;
  let i;
  let rowIndex;
  let _i;
  const _ref = Flow.HTML.template('table.flow-confusion-matrix', 'tbody', 'tr', 'td', 'td.strong', 'td.bg-yellow');
  const table = _ref[0];
  const tbody = _ref[1];
  const tr = _ref[2];
  const normal = _ref[3];
  const bold = _ref[4];
  const yellow = _ref[5];
  const columnCount = cm.columns.length;
  const rowCount = cm.rowcount;
  const headers = lodash.map(cm.columns, (column, i) => bold(column.description));

      // NW corner cell
  headers.unshift(normal(' '));
  const rows = [tr(headers)];
  const errorColumnIndex = columnCount - 2;
  const totalRowIndex = rowCount - 1;
  for (rowIndex = _i = 0; rowCount >= 0 ? _i < rowCount : _i > rowCount; rowIndex = rowCount >= 0 ? ++_i : --_i) {
    cells = (() => {
      let _j;
      let _len;
      const _ref1 = cm.data;
      const _results = [];
      for (i = _j = 0, _len = _ref1.length; _j < _len; i = ++_j) {
        column = _ref1[i];

            // Last two columns should be emphasized
            // special-format error column
        cell = i < errorColumnIndex ? i === rowIndex ? yellow : rowIndex < totalRowIndex ? normal : bold : bold;
        _results.push(cell(i === errorColumnIndex ? format4f(column[rowIndex]) : column[rowIndex]));
      }
      return _results;
    })();
        // Add the corresponding column label
    cells.unshift(bold(rowIndex === rowCount - 1 ? 'Total' : cm.columns[rowIndex].description));
    rows.push(tr(cells));
  }
  return _.plots.push({
    title: title + (cm.description ? ` ${cm.description}` : ''),
    plot: Flow.Dataflow.signal(Flow.HTML.render('div', table(tbody(rows)))),
    frame: Flow.Dataflow.signal(null),
    controls: Flow.Dataflow.signal(null),
    isCollapsed: false,
  });
}
