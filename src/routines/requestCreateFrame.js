import { extendJob } from './extendJob';
import { postCreateFrameRequest } from '../h2oProxy/postCreateFrameRequest';
import { getJobRequest } from '../h2oProxy/getJobRequest';

export function requestCreateFrame(_, opts, go) {
  console.log('arguments from requestCreateFrame', arguments);
  return postCreateFrameRequest(_, opts, (error, result) => {
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
