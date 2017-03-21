import { doGet } from './doGet';

export function getPredictionRequest(_, modelKey, frameKey, go) {
  return doGet(_, `/3/ModelMetrics/models/${encodeURIComponent(modelKey)}/frames/${encodeURIComponent(frameKey)}`, (error, result) => {
    if (error) {
      return go(error);
    }
    return go(null, result);
  });
}
