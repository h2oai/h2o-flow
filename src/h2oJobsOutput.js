import { getJobsRequest } from './h2oProxy/getJobsRequest';
import { formatMilliseconds } from './utils/formatMilliseconds';

import { flowPreludeFunction } from './flowPreludeFunction';
const flowPrelude = flowPreludeFunction();

export function h2oJobsOutput(_, _go, jobs) {
  const lodash = window._;
  const Flow = window.Flow;
  const _jobViews = Flow.Dataflow.signals([]);
  const _hasJobViews = Flow.Dataflow.lift(_jobViews, jobViews => jobViews.length > 0);
  const _isLive = Flow.Dataflow.signal(false);
  const _isBusy = Flow.Dataflow.signal(false);
  const _exception = Flow.Dataflow.signal(null);
  const createJobView = job => {
    const view = () => _.insertAndExecuteCell('cs', `getJob ${flowPrelude.stringify(job.key.name)}`);
    const type = (() => {
      switch (job.dest.type) {
        case 'Key<Frame>':
          return 'Frame';
        case 'Key<Model>':
          return 'Model';
        case 'Key<Grid>':
          return 'Grid';
        case 'Key<PartialDependence>':
          return 'PartialDependence';
        default:
          return 'Unknown';
      }
    })();
    return {
      destination: job.dest.name,
      type,
      description: job.description,
      startTime: Flow.Format.time(new Date(job.start_time)),
      endTime: Flow.Format.time(new Date(job.start_time + job.msec)),
      elapsedTime: formatMilliseconds(job.msec),
      status: job.status,
      view,
    };
  };
  const toggleRefresh = () => _isLive(!_isLive());
  const refresh = () => {
    _isBusy(true);
    return getJobsRequest(_, (error, jobs) => {
      _isBusy(false);
      if (error) {
        _exception(Flow.failure(_, new Flow.Error('Error fetching jobs', error)));
        return _isLive(false);
      }
      _jobViews(lodash.map(jobs, createJobView));
      if (_isLive()) {
        return lodash.delay(refresh, 2000);
      }
    });
  };
  Flow.Dataflow.act(_isLive, isLive => {
    if (isLive) {
      return refresh();
    }
  });
  const initialize = () => {
    _jobViews(lodash.map(jobs, createJobView));
    return lodash.defer(_go);
  };
  initialize();
  return {
    jobViews: _jobViews,
    hasJobViews: _hasJobViews,
    isLive: _isLive,
    isBusy: _isBusy,
    toggleRefresh,
    refresh,
    exception: _exception,
    template: 'flow-jobs-output',
  };
}

