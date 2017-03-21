export function isJobRunning(job) {
  return job.status === 'CREATED' || job.status === 'RUNNING';
}
