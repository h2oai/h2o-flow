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

H2O.JobOutput = (_, _go, _job) ->
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
      else
        'Unknown'

  _runTime = signal null
  _progress = signal null
  _progressMessage = signal null
  _status = signal null
  _statusColor = signal null
  _exception = signal null
  _canView = signal no
  _canCancel = signal no

  isJobRunning = (job) ->
    job.status is 'CREATED' or job.status is 'RUNNING'

  updateJob = (job) ->
    _runTime Flow.Util.formatMilliseconds job.msec
    _progress getJobProgressPercent job.progress
    _progressMessage job.progress_msg
    _status job.status
    _statusColor getJobOutputStatusColor job.status
    _exception if job.exception then Flow.Failure new Flow.Error 'Job failure.', new Error job.exception else null

    _canView not isJobRunning job
    _canCancel isJobRunning job

  refresh = ->
    _isBusy yes
    _.requestJob _key, (error, job) ->
      _isBusy no
      if error
        _exception Flow.Failure new Flow.Error 'Error fetching jobs', error
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
        _.insertAndExecuteCell 'cs', "getFrame #{stringify _destinationKey}" 
      when 'Model'
        _.insertAndExecuteCell 'cs', "getModel #{stringify _destinationKey}" 

  cancel = ->
    _.requestCancelJob _key, (error, result) ->
      if error
        debug error
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
  progress: _progress
  progressMessage: _progressMessage
  status: _status
  statusColor: _statusColor
  exception: _exception
  isLive: _isLive
  canView: _canView
  canCancel: _canCancel
  cancel: cancel
  view: view
  template: 'flow-job-output'

