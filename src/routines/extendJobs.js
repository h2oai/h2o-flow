import { extendJob } from './extendJob';
import { render_ } from './render_';

import { h2oJobsOutput } from '../h2oJobsOutput';

export function extendJobs(_, jobs) {
  let job;
  let _i;
  let _len;
  for (_i = 0, _len = jobs.length; _i < _len; _i++) {
    job = jobs[_i];
    extendJob(_, job);
  }
  return render_(_, jobs, h2oJobsOutput, jobs);
}
