import { doGet } from './doGet';

export function getJobRequest(_, key, go) {
  const lodash = window._;
  const Flow = window.Flow;
  return doGet(_, `/3/Jobs/${encodeURIComponent(key)}`, (error, result) => {
    if (error) {
      return go(new Flow.Error(`Error fetching job \'${key}\'`, error));
    }
    return go(null, lodash.head(result.jobs));
  });
}
