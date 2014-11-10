H2O.PredictsOutput = (_, modelKey, frameKey, _predictions) ->

  _predictionViews = signal []
  _checkAllPredictions = signal no
  _canComparePredictions = signal no

  _isCheckingAll = no
  react _checkAllPredictions, (checkAll) ->
    _isCheckingAll = yes
    for view in _modelViews()
      view.isChecked checkAll
    _canComparePredictions checkAll
    _isCheckingAll = no
    return

  createPredictionView = (prediction) ->
    _modelKey = prediction.model.key
    _frameKey = prediction.frame.key.name
    _isChecked = signal no

    react _isChecked, ->
      return if _isCheckingAll
      checkedViews = (view for view in _predictionViews() when view.isChecked())
      _canComparePredictions checkedViews.length > 1

    view = ->
      _.insertAndExecuteCell 'cs', "getPrediction #{stringify _modelKey}, #{stringify _frameKey}"

    inspect = ->
      _.insertAndExecuteCell 'cs', "inspect getPrediction #{stringify _modelKey}, #{stringify _frameKey}"

    modelKey: _modelKey
    frameKey: _frameKey
    isChecked: _isChecked
    view: view
    inspect: inspect
  
  _predictionTable = _.inspect 'predictions', _predictions

  comparePredictions = ->
    keys = ( { model: view.modelKey, frame: view.frameKey } for view in _predictionViews() when view.isChecked())
    _.insertAndExecuteCell 'cs', "inspect getPredictions #{stringify keys}"

  inspectAll = ->
    _.insertAndExecuteCell 'cs', "inspect #{_predictionTable.meta.origin}"

  predict = ->
    _.insertAndExecuteCell 'cs', 'predict'

  initialize = (predictions) ->
    _predictionViews map predictions, createPredictionView

  initialize _predictions
  
  predictionTable: _predictionTable
  predictionViews: _predictionViews
  hasPredictions: _predictions.length > 0
  comparePredictions: comparePredictions
  canComparePredictions: _canComparePredictions
  checkAllPredictions: _checkAllPredictions
  inspect: inspectAll
  predict: predict
  template: 'flow-predicts-output'

