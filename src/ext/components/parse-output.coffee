H2O.ParseOutput = (_, _result) ->
  viewJob = ->
    _.insertAndExecuteCell 'cs', "getJob #{stringify _result.job.key.name}"

  result: _result
  viewJob: viewJob
  template: 'flow-parse-output'

