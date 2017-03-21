import { isJobRunning } from './isJobRunning';
import { updateJob } from './updateJob';
import { canView } from './canView';

import { getJobRequest } from '../h2oProxy/getJobRequest';

export function refresh(
  _,
  _isBusy,
  _key,
  _exception,
  _isLive,
  _runTime,
  _progress,
  _remainingTime,
  _progressMessage,
  _status,
  _statusColor,
  messageIcons,
  _messages,
  _canView,
  _destinationType,
  _canCancel,
  _go
) {
  const lodash = window._;
  const Flow = window.Flow;

  console.log('arguments passed to jobOutput refresh', arguments);
  _isBusy(true);
  return getJobRequest(_, _key, (error, job) => {
    _isBusy(false);
    if (error) {
      _exception(Flow.failure(_, new Flow.Error('Error fetching jobs', error)));
      return _isLive(false);
    }
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
      if (_isLive()) {
        return lodash.delay(refresh.bind(
          this,
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
        ), 1000);
      }
    } else {
      _isLive(false);
      if (_go) {
        return lodash.defer(_go);
      }
    }
  });
}
