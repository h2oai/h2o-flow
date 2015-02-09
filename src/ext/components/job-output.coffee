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

H2O.JobOutput = (_, _job) ->
  _isBusy = signal no
  _isLive = signal no

  _key = _job.key.name
  _description = _job.description
  _destinationKey = _job.dest.name
  _runTime = signal null
  _progress = signal null
  _progressMessage = signal null
  _status = signal null
  _statusColor = signal null
  _exception = signal null
  _canView = signal no

  isJobRunning = (job) ->
    job.status is 'CREATED' or job.status is 'RUNNING'

  updateJob = (job) ->
    _runTime job.msec
    _progress getJobProgressPercent job.progress
    _progressMessage job.progress_msg
    _status job.status
    _statusColor getJobOutputStatusColor job.status
    _exception if job.exception then Flow.Failure new Flow.Error "Job failure.", new Error job.exception else null
    _canView not isJobRunning job

  toggleRefresh = ->
    _isLive not _isLive()

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
          toggleRefresh()

  act _isLive, (isLive) ->
    refresh() if isLive

  view = ->
    return unless _canView()
    _.requestInspect _destinationKey, (error, result) ->
      if error
        _exception Flow.Failure new Flow.Error "Error inspecting job target.", error
      else
        switch result.kind
          when 'frame'
            _.insertAndExecuteCell 'cs', "getFrame #{stringify _destinationKey}" 
          when 'model'
            _.insertAndExecuteCell 'cs', "getModel #{stringify _destinationKey}" 


  initialize = (job) ->
    updateJob job
    toggleRefresh() if isJobRunning job

  initialize _job

  key: _key
  description: _description
  destinationKey: _destinationKey
  runTime: _runTime
  progress: _progress
  progressMessage: _progressMessage
  status: _status
  statusColor: _statusColor
  exception: _exception
  isLive: _isLive
  toggleRefresh: toggleRefresh
  canView: _canView
  view: view
  template: 'flow-job-output'

