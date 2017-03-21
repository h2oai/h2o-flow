import { extendPrediction } from './extendPrediction';

export function unwrapPrediction(_, go) {
  return function (error, result) {
    if (error) {
      return go(error);
    }
    return go(null, extendPrediction(_, result));
  };
}
