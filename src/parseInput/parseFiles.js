import { flowPreludeFunction } from '../flowPreludeFunction';
const flowPrelude = flowPreludeFunction();

export function parseFiles(
  _,
  _columns,
  _headerOptions,
  _headerOption,
  _inputKey,
  _inputs,
  _destinationKey,
  _parseType,
  _delimiter,
  _columnCount,
  _useSingleQuotes,
  _canReconfigure,
  _deleteOnDone,
  _chunkSize
) {
  const lodash = window._;
  let column;
  let columnNames;
  let headerOption;
  columnNames = (() => {
    let _i;
    let _len;
    const _ref = _columns();
    const _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      column = _ref[_i];
      _results.push(column.name());
    }
    return _results;
  })();
  headerOption = _headerOptions[_headerOption()];
  if (lodash.every(columnNames, columnName => columnName.trim() === '')) {
    columnNames = null;
    headerOption = -1;
  }
  const columnTypes = (() => {
    let _i;
    let _len;
    const _ref = _columns();
    const _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      column = _ref[_i];
      _results.push(column.type());
    }
    return _results;
  })();
  const codeCellCode = 'parseFiles\n  ' + _inputKey + ': ' + flowPrelude.stringify(_inputs[_inputKey]) + '\n  destination_frame: ' + flowPrelude.stringify(_destinationKey()) + '\n  parse_type: ' + flowPrelude.stringify(_parseType().type) + '\n  separator: ' + _delimiter().charCode + '\n  number_columns: ' + _columnCount() + '\n  single_quotes: ' + _useSingleQuotes() + '\n  ' + (_canReconfigure() ? 'column_names: ' + flowPrelude.stringify(columnNames) + '\n  ' : '') + (_canReconfigure() ? 'column_types: ' + flowPrelude.stringify(columnTypes) + '\n  ' : '') + 'delete_on_done: ' + _deleteOnDone() + '\n  check_header: ' + headerOption + '\n  chunk_size: ' + _chunkSize(); // eslint-disable-line prefer-template
  return _.insertAndExecuteCell('cs', codeCellCode);
}
