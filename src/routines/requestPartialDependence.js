import { extendJob } from './extendJob';
import { getJobRequest } from '../h2oProxy/getJobRequest';
import { postPartialDependenceRequest } from '../h2oProxy/postPartialDependenceRequest';

export function requestPartialDependence(_, opts, go) {
  return postPartialDependenceRequest(_, opts, (error, result) => {
    if (error) {
      return go(error);
    }
    return getJobRequest(_, result.key.name, (error, job) => {
      if (error) {
        return go(error);
      }
      return go(null, extendJob(_, job));
    });
  });
}
