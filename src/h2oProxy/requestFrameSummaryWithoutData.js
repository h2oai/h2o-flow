import { doGet } from './doGet';

export function requestFrameSummaryWithoutData(_, key, go) {
  return doGet(_, `/3/Frames/${encodeURIComponent(key)}/summary?_exclude_fields=frames/chunk_summary,frames/distribution_summary,frames/columns/data,frames/columns/domain,frames/columns/histogram_bins,frames/columns/percentiles`, (error, result) => {
    const lodash = window._;
    if (error) {
      return go(error);
    }
    return go(null, lodash.head(result.frames));
  });
}
