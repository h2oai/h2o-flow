import { doPost } from './doPost';

export function postCancelJobRequest(_, key, go) {
  const Flow = window.Flow;
  return doPost(_, `/3/Jobs/${encodeURIComponent(key)}/cancel`, {}, (error, result) => {
    if (error) {
      return go(new Flow.Error(`Error canceling job \'${key}\'`, error));
    }
    return go(null);
  });
}
