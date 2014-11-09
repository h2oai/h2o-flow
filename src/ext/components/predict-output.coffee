H2O.PredictOutput = (_, prediction) ->
  { frame, model } = prediction

  inspect = ->
    _.insertAndExecuteCell 'cs', "inspect predict #{stringify model.key}, #{stringify frame.key.name}"
  
  inspect: inspect
  template: 'flow-predict-output'
