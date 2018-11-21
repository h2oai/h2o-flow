{ defer, map, delay } = require('lodash')

{ stringify } = require('../../core/modules/prelude')
{ act, react, lift, link, signal, signals } = require("../../core/modules/dataflow")

failure = require('../../core/components/failure')
FlowError = require('../../core/modules/flow-error')
util = require('../../core/modules/util')
format = require('../../core/modules/format')

module.exports = (_, _go, jobs) ->
  _jobViews = signals []
  _hasJobViews = lift _jobViews, (jobViews) -> jobViews.length > 0
  _isLive = signal no
  _isBusy = signal no
  _exception = signal null

  createJobView = (job) ->
    view = ->
      _.insertAndExecuteCell 'cs', "getJob #{stringify job.key.name}" 

    type = switch job.dest.type
      when 'Key<Frame>'
        'Frame'
      when 'Key<Model>'
        'Model'
      when 'Key<Grid>'
        'Grid'
      when 'Key<PartialDependence>'
        'PartialDependence'
      when 'Key<AutoML>'
        'Auto Model'
      when 'Key<ScalaCodeResult>'
        'Scala Code Execution'
      when 'Key<KeyedVoid>'
        'Void'
      else
        'Unknown'

    destination: job.dest.name
    type: type
    description: job.description
    startTime: format.Time new Date job.start_time
    endTime: format.Time new Date job.start_time + job.msec
    elapsedTime: util.formatMilliseconds job.msec
    status: job.status
    view: view

  toggleRefresh = ->
    _isLive not _isLive()

  refresh = ->
    _isBusy yes
    _.requestJobs (error, jobs) ->
      _isBusy no
      if error
        _exception failure _, new FlowError 'Error fetching jobs', error
        _isLive no
      else
        _jobViews map jobs, createJobView
        delay refresh, 2000 if _isLive()

  act _isLive, (isLive) ->
    refresh() if isLive

  initialize = ->
    _jobViews map jobs, createJobView
    defer _go

  initialize()

  jobViews: _jobViews
  hasJobViews: _hasJobViews
  isLive: _isLive
  isBusy: _isBusy
  toggleRefresh: toggleRefresh
  refresh: refresh
  exception: _exception
  template: 'flow-jobs-output'

