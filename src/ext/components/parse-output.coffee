H2O.ParseOutput = (_, _result) ->
  inspectJob = ->
    _.insertAndExecuteCell 'cs', "getJob #{stringify _result.job.name}"

  result: _result
  inspectJob: inspectJob
  template: 'flow-parse-output'

