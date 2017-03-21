import { render_ } from './render_';
import { h2oJobOutput } from '../jobOutput/h2oJobOutput';

export function extendJob(_, job) {
  return render_(_, job, h2oJobOutput, job);
}
