H2O.BindFramesOutput = (_, _go, result) ->
  viewFrame = ->
    _.insertAndExecuteCell 'cs', "getFrameSummary #{stringify result.key.name}"

  defer _go

  viewFrame: viewFrame
  template: 'flow-bind-frames-output'


