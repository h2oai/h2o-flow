import { _fork } from './_fork';
import { requestStackTrace } from './requestStackTrace';

export function getStackTrace(_) {
  return _fork(requestStackTrace, _);
}
