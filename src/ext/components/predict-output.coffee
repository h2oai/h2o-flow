H2O.PredictOutput = (_, prediction) ->
  { frame, model } = prediction
  _isBinomial = signal prediction.model_category is 'Binomial'
  _isMultinomial = signal prediction.model_category is 'Multinomial'
  _isRegression = signal prediction.model_category is 'Regression'
  _isClustering = signal prediction.model_category is 'Clustering'

  _predictionRecord = signal null
  _aucPlot = signal null

  #_predictionTable = _.inspect 'prediction', prediction

  if _isBinomial()
    renderPredictionRecord = _.enumerate _.inspect 'prediction', prediction

    renderPredictionRecord (error, vis) ->
      if error
        debug error
      else
        _predictionRecord vis.element

    renderAucPlot = _.plot (g) ->
      g(
        g.path g.position 'FPR', 'TPR'
        g.from _.inspect 'scores', prediction
      )

    renderAucPlot (error, vis) ->
      if error
        debug error
      else
        _aucPlot vis.element

  inspect = ->
    #XXX get this from prediction table
    _.insertAndExecuteCell 'cs', "inspect getPrediction #{stringify model.name}, #{stringify frame.name}"

  viewPredictionFrame = ->
    _.insertAndExecuteCell 'cs', "getFrame #{stringify prediction.predictions.key.name}"

  isBinomial: _isBinomial
  isMultinomial: _isMultinomial
  isRegression: _isRegression
  isClustering: _isClustering
  predictionRecord: _predictionRecord
  aucPlot: _aucPlot
  inspect: inspect
  viewPredictionFrame: viewPredictionFrame
  template: 'flow-predict-output'
