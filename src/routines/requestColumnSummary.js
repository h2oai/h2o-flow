import { extendColumnSummary } from './extendColumnSummary';
import { getColumnSummaryRequest } from '../h2oProxy/getColumnSummaryRequest';

export function requestColumnSummary(_, frameKey, columnName, go) {
  return getColumnSummaryRequest(_, frameKey, columnName, (error, frame) => {
    if (error) {
      return go(error);
    }
    return go(null, extendColumnSummary(_, frameKey, frame, columnName));
  });
}
