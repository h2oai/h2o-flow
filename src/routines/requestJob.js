import { extendJob } from './extendJob';
import { getJobRequest } from '../h2oProxy/getJobRequest';

export function requestJob(_, key, go) {
  return getJobRequest(_, key, (error, job) => {
    if (error) {
      return go(error);
    }
    return go(null, extendJob(_, job));
  });
}
