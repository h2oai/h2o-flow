import { unwrapPrediction } from './unwrapPrediction';
import { postPredictRequest } from '../h2oProxy/postPredictRequest';

export function requestPredict(_, destinationKey, modelKey, frameKey, options, go) {
  return postPredictRequest(_, destinationKey, modelKey, frameKey, options, unwrapPrediction(_, go));
}
