import { createCell } from './createCell';
import { selectCell } from './selectCell';

export function deserialize(
  _,
  localName,
  remoteName,
  doc
) {
  const lodash = window._;
  let cell;
  let _i;
  let _len;
  _.localName(localName);
  _.remoteName(remoteName);
  const cells = (() => {
    let _i;
    let _len;
    const _ref = doc.cells;
    const _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      cell = _ref[_i];
      _results.push(createCell(_, cell.type, cell.input));
    }
    return _results;
  })();
  _.cells(cells);
  selectCell(_, lodash.head(cells));

      // Execute all non-code cells (headings, markdown, etc.)
  const _ref = _.cells();
  for (_i = 0, _len = _ref.length; _i < _len; _i++) {
    cell = _ref[_i];
    if (!cell.isCode()) {
      cell.execute();
    }
  }
}
