H2O.ParseOutput = (_, _go, _result) ->
  viewJob = ->
    _.insertAndExecuteCell 'cs', "getJob #{stringify _result.job.dest.name}"

  defer _go

  result: _result
  viewJob: viewJob
  template: 'flow-parse-output'

