import { _fork } from './_fork';
import { requestCloud } from './requestCloud';

export function getCloud(_) {
  return _fork(requestCloud, _);
}
