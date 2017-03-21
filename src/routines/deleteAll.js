import { _fork } from './_fork';
import { requestRemoveAll } from './requestRemoveAll';

export function deleteAll(_) {
  return _fork(requestRemoveAll, _);
}
