import { extendBindFrames } from './extendBindFrames';
import { requestExec } from '../h2oProxy/requestExec';

export function requestBindFrames(_, key, sourceKeys, go) {
  return requestExec(_, `(assign ${key} (cbind ${sourceKeys.join(' ')}))`, (error, result) => {
    if (error) {
      return go(error);
    }
    return go(null, extendBindFrames(_, key, result));
  });
}
