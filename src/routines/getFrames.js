import { _fork } from './_fork';
import { requestFrames } from './requestFrames';

export function getFrames(_) {
  return _fork(requestFrames, _);
}
