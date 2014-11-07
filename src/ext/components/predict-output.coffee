H2O.PredictOutput = (_, modelMetrics) ->
  { frame, model } = modelMetrics

  inspect = ->
    _.insertAndExecuteCell 'cs', "inspect predict #{stringify model.key}, #{stringify frame.key.name}"
  
  inspect: inspect
  template: 'flow-predict-output'
