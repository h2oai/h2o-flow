import { extendDeletedKeys } from './extendDeletedKeys';

export function requestDeleteFrame(_, frameKey, go) {
  return _.requestDeleteFrame(_, frameKey, (error, result) => {
    if (error) {
      return go(error);
    }
    return go(null, extendDeletedKeys(_, [frameKey]));
  });
}
