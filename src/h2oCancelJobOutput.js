export function h2oCancelJobOutput(_, _go, _cancellation) {
  const lodash = window._;
  lodash.defer(_go);
  return { template: 'flow-cancel-job-output' };
}
