import { _fork } from './_fork';
import { extendDeletedKeys } from './extendDeletedKeys';

export function requestDeleteFrames(_, frameKeys, go) {
  const lodash = window._;
  const Flow = window.Flow;
  const futures = lodash.map(frameKeys, frameKey => _fork(_.requestDeleteFrame, _, frameKey));
  return Flow.Async.join(futures, (error, results) => {
    if (error) {
      return go(error);
    }
    return go(null, extendDeletedKeys(_, frameKeys));
  });
}
