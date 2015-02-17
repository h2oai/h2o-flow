H2O.JobsOutput = (_, _go, jobs) ->
  _jobViews = signals []
  _hasJobViews = lift _jobViews, (jobViews) -> jobViews.length > 0
  _isLive = signal no
  _isBusy = signal no
  _exception = signal null

  createJobView = (job) ->
    view = ->
      _.insertAndExecuteCell 'cs', "getJob #{stringify job.dest.name}" 

    type = switch job.dest.type
      when 'Key<Frame>'
        'Frame'
      when 'Key<Model>'
        'Model'
      else
        'Unknown'

    key: job.dest.name
    type: type
    description: job.description
    status: job.status
    view: view

  toggleRefresh = ->
    _isLive not _isLive()

  refresh = ->
    _isBusy yes
    _.requestJobs (error, jobs) ->
      _isBusy no
      if error
        _exception Flow.Failure new Flow.Error 'Error fetching jobs', error
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

