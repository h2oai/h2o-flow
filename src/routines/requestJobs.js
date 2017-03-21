import { getJobsRequest } from '../h2oProxy/getJobsRequest';
import { extendJobs } from './extendJobs';

export function requestJobs(_, go) {
  return getJobsRequest(_, (error, jobs) => {
    if (error) {
      return go(error);
    }
    return go(null, extendJobs(_, jobs));
  });
}
