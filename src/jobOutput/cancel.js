import { updateJob } from './updateJob';

import { postCancelJobRequest } from '../h2oProxy/postCancelJobRequest';

export function cancel(_, _key, _job) {
  return postCancelJobRequest(_, _key, (error, result) => {
    if (error) {
      return console.debug(error);
    }
    return updateJob(_job);
  });
}
