import { _fork } from './_fork';
import { requestJobs } from './requestJobs';

export function getJobs(_) {
  return _fork(requestJobs, _);
}
