import { extendFrame } from './extendFrame';
import { requestFrameSlice } from '../h2oProxy/requestFrameSlice';

export function requestFrame(_, frameKey, go) {
  return requestFrameSlice(_, frameKey, void 0, 0, 20, (error, frame) => {
    if (error) {
      return go(error);
    }
    return go(null, extendFrame(_, frameKey, frame));
  });
}
