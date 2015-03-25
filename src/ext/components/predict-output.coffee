H2O.PredictOutput = (_, _go, prediction) ->
  { frame, model } = prediction
  _isBinomial = signal prediction.model_category is 'Binomial'
  _isMultinomial = signal prediction.model_category is 'Multinomial'
  _isRegression = signal prediction.model_category is 'Regression'
  _isClustering = signal prediction.model_category is 'Clustering'

  _predictionRecord = signal null
  _rocCurve = signal null

  #_predictionTable = _.inspect 'prediction', prediction

  renderPlot = (target, render) ->
    render (error, vis) ->
      if error
        debug error
      else
        target vis.element

  if _isBinomial()
    renderPlot _predictionRecord, _.enumerate _.inspect 'Prediction', prediction
    renderPlot _rocCurve, _.plot (g) ->
      g(
        g.path g.position 'FPR', 'TPR'
        g.line(
          g.position (g.value 1), (g.value 0)
          g.strokeColor g.value 'red'
        )
        g.from _.inspect 'Confusion Matrices', prediction
      )

  if _isMultinomial()
    renderPlot _predictionRecord, _.enumerate _.inspect 'prediction', prediction

  inspect = ->
    #XXX get this from prediction table
    _.insertAndExecuteCell 'cs', "inspect getPrediction model: #{stringify model.name}, frame: #{stringify frame.name}"

  viewPredictionFrame = ->
    _.insertAndExecuteCell 'cs', "getFrame #{stringify prediction.predictions.key.name}"

  defer _go

  isBinomial: _isBinomial
  isMultinomial: _isMultinomial
  isRegression: _isRegression
  isClustering: _isClustering
  predictionRecord: _predictionRecord
  rocCurve: _rocCurve
  inspect: inspect
  viewPredictionFrame: viewPredictionFrame
  template: 'flow-predict-output'
