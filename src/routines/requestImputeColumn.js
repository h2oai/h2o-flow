import { requestColumnSummary } from './requestColumnSummary';
import { findColumnIndicesByColumnLabels } from './findColumnIndicesByColumnLabels';
import { findColumnIndexByColumnLabel } from './findColumnIndexByColumnLabel';
import { requestExec } from '../h2oProxy/requestExec';

export function requestImputeColumn(_, opts, go) {
  let combineMethod;
  const frame = opts.frame;
  const column = opts.column;
  const method = opts.method;
  combineMethod = opts.combineMethod;
  const groupByColumns = opts.groupByColumns;
  combineMethod = combineMethod != null ? combineMethod : 'interpolate';
  return _.requestFrameSummaryWithoutData(_, frame, (error, result) => {
    let columnIndex;
    let columnIndicesError;
    let columnKeyError;
    let groupByColumnIndices;
    if (error) {
      return go(error);
    }
    try {
      columnIndex = findColumnIndexByColumnLabel(result, column);
    } catch (_error) {
      columnKeyError = _error;
      return go(columnKeyError);
    }
    if (groupByColumns && groupByColumns.length) {
      try {
        groupByColumnIndices = findColumnIndicesByColumnLabels(result, groupByColumns);
      } catch (_error) {
        columnIndicesError = _error;
        return go(columnIndicesError);
      }
    } else {
      groupByColumnIndices = null;
    }
    const groupByArg = groupByColumnIndices ? `[${groupByColumnIndices.join(' ')}]` : '[]';
    return requestExec(_, `(h2o.impute ${frame} ${columnIndex} ${JSON.stringify(method)} ${JSON.stringify(combineMethod)} ${groupByArg} _ _)`, (error, result) => {
      if (error) {
        return go(error);
      }
      return requestColumnSummary(_, frame, column, go);
    });
  });
}
