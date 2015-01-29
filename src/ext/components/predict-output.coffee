H2O.PredictOutput = (_, prediction) ->
  { frame, model } = prediction

  #_predictionTable = _.inspect 'prediction', prediction

  inspect = ->
    #XXX get this from prediction table
    _.insertAndExecuteCell 'cs', "inspect getPrediction #{stringify model.name}, #{stringify frame.name}"

  viewPredictionFrame = ->
    _.insertAndExecuteCell 'cs', "getFrame #{stringify prediction.predictions.key.name}"

  #predictionTable: _predictionTable
  inspect: inspect
  viewPredictionFrame: viewPredictionFrame
  template: 'flow-predict-output'
