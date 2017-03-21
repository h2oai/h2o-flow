import { updateJob } from './updateJob';
import { canView } from './canView';
import { isJobRunning } from './isJobRunning';

export function initialize(
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
  _destinationType,
  _canCancel,
  _isLive,
  _go,
  job
) {
  const lodash = window._;
  updateJob(
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
    );
  if (isJobRunning(job)) {
    return _isLive(true);
  }
  if (_go) {
    return lodash.defer(_go);
  }
}
