import { getJobProgressPercent } from './getJobProgressPercent';
import { getJobOutputStatusColor } from './getJobOutputStatusColor';
import { isJobRunning } from './isJobRunning';

import { formatMilliseconds } from '../utils/formatMilliseconds';

export function updateJob(
  _,
  _runTime,
  _progress,
  _remainingTime,
  _progressMessage,
  _status,
  _statusColor,
  messageIcons,
  _messages,
  _exception,
  _canView,
  canView,
  _destinationType,
  _canCancel,
  job
) {
  const Flow = window.Flow;
  let cause;
  let message;
  let messages;
  _runTime(formatMilliseconds(job.msec));
  _progress(getJobProgressPercent(job.progress));
  _remainingTime(job.progress ? formatMilliseconds(Math.round((1 - job.progress) * job.msec / job.progress)) : 'Estimating...');
  _progressMessage(job.progress_msg);
  _status(job.status);
  _statusColor(getJobOutputStatusColor(job.status));
  if (job.error_count) {
    messages = (() => {
      let _i;
      let _len;
      const _ref = job.messages;
      const _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        message = _ref[_i];
        if (message.message_type !== 'HIDE') {
          _results.push({
            icon: messageIcons[message.message_type],
            message: `${message.field_name}: ${message.message}`,
          });
        }
      }
      return _results;
    })();
    _messages(messages);
  } else if (job.exception) {
    cause = new Error(job.exception);
    if (job.stacktrace) {
      cause.stack = job.stacktrace;
    }
    _exception(Flow.failure(_, new Flow.Error('Job failure.', cause)));
  }
  _canView(canView(_destinationType, job));
  return _canCancel(isJobRunning(job));
}
