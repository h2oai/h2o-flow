{ defer, delay } = require('lodash')

{ stringify } = require('../../core/modules/prelude')
{ act, react, lift, link, signal, signals } = require("../../core/modules/dataflow")

failure = require('../../core/components/failure')
FlowError = require('../../core/modules/flow-error')
util = require('../../core/modules/util')

jobOutputStatusColors =
  failed: '#d9534f'
  done: '#ccc' #'#5cb85c'
  running: '#f0ad4e'

getJobOutputStatusColor = (status) ->
  # CREATED   Job was created
  # RUNNING   Job is running
  # CANCELLED Job was cancelled by user
  # FAILED    Job crashed, error message/exception is available
  # DONE      Job was successfully finished
  switch status
    when 'DONE'
      jobOutputStatusColors.done
    when 'CREATED', 'RUNNING'
      jobOutputStatusColors.running
    else # 'CANCELLED', 'FAILED'
      jobOutputStatusColors.failed

getJobProgressPercent = (progress) ->
  "#{Math.ceil 100 * progress}%"

module.exports = (_, _go, _job) ->
  _isBusy = signal no
  _isLive = signal no

  _key = _job.key.name
  _description = _job.description
  _destinationKey = _job.dest.name
  _destinationType = switch _job.dest.type
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

  _runTime = signal null
  _remainingTime = signal null
  _progress = signal null
  _progressMessage = signal null
  _status = signal null
  _statusColor = signal null
  _exception = signal null
  _messages = signal null
  _canView = signal no
  _canCancel = signal no

  isJobRunning = (job) ->
    job.status is 'CREATED' or job.status is 'RUNNING'

  messageIcons =
    ERROR: 'fa-times-circle red'
    WARN: 'fa-warning orange'
    INFO: 'fa-info-circle'

  canView = (job) ->
    switch _destinationType
      when 'Model', 'Grid', 'Auto Model'
        job.ready_for_view
      else
        not isJobRunning job

  updateJob = (job) ->
    _runTime util.formatMilliseconds job.msec
    _progress getJobProgressPercent job.progress
    _remainingTime if job.progress then (util.formatMilliseconds Math.round((1 - job.progress) * job.msec / job.progress)) else 'Estimating...'
    _progressMessage job.progress_msg
    _status job.status
    _statusColor getJobOutputStatusColor job.status
    if job.error_count
      messages = for message in job.messages when message.message_type isnt 'HIDE'
        icon: messageIcons[message.message_type]
        message: "#{message.field_name}: #{message.message}"
      _messages messages

    else if job.exception
      cause = new Error job.exception
      if job.stacktrace
        cause.stack = job.stacktrace
      _exception failure _, new FlowError 'Job failure.', cause

    _canView canView job
    _canCancel isJobRunning job

  refresh = ->
    _isBusy yes
    _.requestJob _key, (error, job) ->
      _isBusy no
      if error
        _exception failure _, new FlowError 'Error fetching jobs', error
        _isLive no
      else
        updateJob job
        if isJobRunning job
          delay refresh, 1000 if _isLive()
        else
          _isLive no
          defer _go if _go

  act _isLive, (isLive) ->
    refresh() if isLive

  view = ->
    return unless _canView()
    switch _destinationType
      when 'Frame'
        _.insertAndExecuteCell 'cs', "getFrameSummary #{stringify _destinationKey}" 
      when 'Model'
        _.insertAndExecuteCell 'cs', "getModel #{stringify _destinationKey}"
      when 'Grid'
        _.insertAndExecuteCell 'cs', "getGrid #{stringify _destinationKey}"
      when 'PartialDependence'
        _.insertAndExecuteCell 'cs', "getPartialDependence #{stringify _destinationKey}"
      when 'Auto Model'
        _.insertAndExecuteCell 'cs', "getLeaderboard #{stringify _destinationKey}"
      when 'Scala Code Execution'
        _.insertAndExecuteCell 'cs', "getScalaCodeExecutionResult #{stringify _destinationKey}"
      when 'Void'
        alert "This frame was exported to\n#{_job.dest.name}"

  cancel = ->
    _.requestCancelJob _key, (error, result) ->
      if error
        console.debug error
      else
        updateJob _job

  initialize = (job) ->
    updateJob job
    if isJobRunning job
      _isLive yes
    else
      defer _go if _go

  initialize _job

  key: _key
  description: _description
  destinationKey: _destinationKey
  destinationType: _destinationType
  runTime: _runTime
  remainingTime: _remainingTime
  progress: _progress
  progressMessage: _progressMessage
  status: _status
  statusColor: _statusColor
  messages: _messages
  exception: _exception
  isLive: _isLive
  canView: _canView
  canCancel: _canCancel
  cancel: cancel
  view: view
  template: 'flow-job-output'

