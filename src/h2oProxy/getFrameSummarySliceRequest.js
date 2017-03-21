import { doGet } from './doGet';
import { unwrap } from './unwrap';

export function getFrameSummarySliceRequest(_, key, searchTerm, offset, count, go) {
  const lodash = window._;
  const urlString = `/3/Frames/${encodeURIComponent(key)}/summary?column_offset=${offset}&column_count=${count}&_exclude_fields=frames/columns/data,frames/columns/domain,frames/columns/histogram_bins,frames/columns/percentiles`;
  return doGet(_, urlString, unwrap(go, result => lodash.head(result.frames)));
}
