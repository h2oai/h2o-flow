H2O.JobsOutput = (_, jobs) ->
  _jobViews = signals []
  _hasJobViews = lift _jobViews, (jobViews) -> jobViews.length > 0
  _isLive = signal no
  _isBusy = signal no
  _exception = signal null

  createJobView = (job) ->
    inspect = ->
      _.insertAndExecuteCell 'cs', "getJob #{stringify job.key.name}" 

    job: job
    inspect: inspect

  toggleRefresh = ->
    _isLive not _isLive()

  refresh = ->
    _isBusy yes
    _.requestJobs (error, jobs) ->
      _isBusy no
      if error
        _exception Flow.Exception 'Error fetching jobs', error
        _isLive no
      else
        _jobViews map jobs, createJobView
        delay refresh, 2000 if _isLive()

  act _isLive, (isLive) ->
    refresh() if isLive

  initialize = ->
    _jobViews map jobs, createJobView

  initialize()

  jobViews: _jobViews
  hasJobViews: _hasJobViews
  isLive: _isLive
  isBusy: _isBusy
  toggleRefresh: toggleRefresh
  refresh: refresh
  exception: _exception
  template: 'flow-jobs-output'

