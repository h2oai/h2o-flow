import { postParseSetupPreviewRequest } from '../h2oProxy/postParseSetupPreviewRequest';

export function refreshPreview(
  _,
  _columns,
  _sourceKeys,
  _parseType,
  _delimiter,
  _useSingleQuotes,
  _headerOptions,
  _headerOption,
  _preview
) {
  let column;
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
  return postParseSetupPreviewRequest(_, _sourceKeys, _parseType().type, _delimiter().charCode, _useSingleQuotes(), _headerOptions[_headerOption()], columnTypes, (error, result) => {
    if (!error) {
      return _preview(result);
    }
  });
}
