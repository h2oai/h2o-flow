import { extendFrames } from './extendFrames';

export function requestFrames(_, go) {
  return _.requestFrames(_, (error, frames) => {
    if (error) {
      return go(error);
    }
    return go(null, extendFrames(_, frames));
  });
}
