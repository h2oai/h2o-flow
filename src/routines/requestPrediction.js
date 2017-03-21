import { unwrapPrediction } from './unwrapPrediction';
import { getPredictionRequest } from '../h2oProxy/getPredictionRequest';

export function requestPrediction(_, modelKey, frameKey, go) {
  return getPredictionRequest(_, modelKey, frameKey, unwrapPrediction(_, go));
}
