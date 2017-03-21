import { findColumnIndexByColumnLabel } from './findColumnIndexByColumnLabel';

export function findColumnIndicesByColumnLabels(frame, columnLabels) {
  let columnLabel;
  let _i;
  let _len;
  const _results = [];
  for (_i = 0, _len = columnLabels.length; _i < _len; _i++) {
    columnLabel = columnLabels[_i];
    _results.push(findColumnIndexByColumnLabel(frame, columnLabel));
  }
  return _results;
}
