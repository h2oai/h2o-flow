import { doGet } from './doGet';
import { unwrap } from './unwrap';

export function getColumnSummaryRequest(_, frameKey, column, go) {
  const lodash = window._;
  const urlString = `/3/Frames/${encodeURIComponent(frameKey)}/columns/${encodeURIComponent(column)}/summary`;
  return doGet(_, urlString, unwrap(go, result => lodash.head(result.frames)));
}
