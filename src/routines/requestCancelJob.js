
import { extendCancelJob } from './extendCancelJob';
import { postCancelJobRequest } from '../h2oProxy/postCancelJobRequest';

export function requestCancelJob(_, key, go) {
  return postCancelJobRequest(_, key, error => {
    if (error) {
      return go(error);
    }
    return go(null, extendCancelJob(_, {}));
  });
}
