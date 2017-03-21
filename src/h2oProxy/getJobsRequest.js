import { doGet } from './doGet';

export function getJobsRequest(_, go) {
  const Flow = window.Flow;
  return doGet(_, '/3/Jobs', (error, result) => {
    if (error) {
      return go(new Flow.Error('Error fetching jobs', error));
    }
    return go(null, result.jobs);
  });
}
