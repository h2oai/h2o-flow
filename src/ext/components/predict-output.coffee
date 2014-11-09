H2O.PredictOutput = (_, prediction) ->
  { frame, model } = prediction

  _predictionTable = _.inspect 'prediction', prediction

  inspect = ->
    #XXX get this from prediction table
    _.insertAndExecuteCell 'cs', "inspect predict #{stringify model.key}, #{stringify frame.key.name}"

  predictionTable: _predictionTable
  inspect: inspect
  template: 'flow-predict-output'
