import { isJobRunning } from './isJobRunning';
import { canView } from './canView';
import { cancel } from './cancel';
import { updateJob } from './updateJob';
import { view } from './view';
import { initialize } from './initialize';

import { getJobRequest } from '../h2oProxy/getJobRequest';

export function h2oJobOutput(_, _go, _job) {
  const lodash = window._;
  const Flow = window.Flow;
  const H2O = window.H2O;
  const _isBusy = Flow.Dataflow.signal(false);
  const _isLive = Flow.Dataflow.signal(false);
  const _key = _job.key.name;
  const _description = _job.description;
  const _destinationKey = _job.dest.name;
  const _destinationType = (() => {
    switch (_job.dest.type) {
      case 'Key<Frame>':
        return 'Frame';
      case 'Key<Model>':
        return 'Model';
      case 'Key<Grid>':
        return 'Grid';
      case 'Key<PartialDependence>':
        return 'PartialDependence';
      case 'Key<AutoML>':
        return 'Auto Model';
      case 'Key<KeyedVoid>':
        return 'Void';
      default:
        return 'Unknown';
    }
  })();
  const _runTime = Flow.Dataflow.signal(null);
  const _remainingTime = Flow.Dataflow.signal(null);
  const _progress = Flow.Dataflow.signal(null);
  const _progressMessage = Flow.Dataflow.signal(null);
  const _status = Flow.Dataflow.signal(null);
  const _statusColor = Flow.Dataflow.signal(null);
  const _exception = Flow.Dataflow.signal(null);
  const _messages = Flow.Dataflow.signal(null);
  const _canView = Flow.Dataflow.signal(false);
  const _canCancel = Flow.Dataflow.signal(false);
  const messageIcons = {
    ERROR: 'fa-times-circle red',
    WARN: 'fa-warning orange',
    INFO: 'fa-info-circle',
  };
  // abstracting this out produces an error
  // defer for now
  const refresh = () => {
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
          return lodash.delay(refresh, 1000);
        }
      } else {
        _isLive(false);
        if (_go) {
          return lodash.defer(_go);
        }
      }
    });
  };
  Flow.Dataflow.act(_isLive, isLive => {
    if (isLive) {
      return refresh();
    }
  });
  initialize(
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
    _job
  );
  return {
    key: _key,
    description: _description,
    destinationKey: _destinationKey,
    destinationType: _destinationType,
    runTime: _runTime,
    remainingTime: _remainingTime,
    progress: _progress,
    progressMessage: _progressMessage,
    status: _status,
    statusColor: _statusColor,
    messages: _messages,
    exception: _exception,
    isLive: _isLive,
    canView: _canView.bind(this, _destinationType),
    canCancel: _canCancel,
    cancel: cancel.bind(this, _, _key, _job),
    view: view.bind(
      this,
      _,
      _canView,
      _destinationType,
      _job,
      _destinationKey
    ),
    template: 'flow-job-output',
  };
}
