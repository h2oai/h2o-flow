{ defer, map, every } = require('lodash')

{ stringify } = require('../../core/modules/prelude')
{ react, lift, link, signal, signals } = require("../../core/modules/dataflow")

module.exports = (_, _go, opts, _predictions) ->

  _predictionViews = signal []
  _checkAllPredictions = signal no
  _canComparePredictions = signal no
  _rocCurve = signal null

  arePredictionsComparable = (views) ->
    return no if views.length is 0
    every views, (view) -> view.modelCategory is 'Binomial'

  _isCheckingAll = no
  react _checkAllPredictions, (checkAll) ->
    _isCheckingAll = yes
    for view in _predictionViews()
      view.isChecked checkAll
    _canComparePredictions checkAll and arePredictionsComparable _predictionViews()
    _isCheckingAll = no
    return

  createPredictionView = (prediction) ->
    _modelKey = prediction.model.name
    _frameKey = prediction.frame?.name
    _hasFrame = if _frameKey then yes else no
    _isChecked = signal no

    react _isChecked, ->
      return if _isCheckingAll
      checkedViews = (view for view in _predictionViews() when view.isChecked())
      _canComparePredictions arePredictionsComparable checkedViews

    view = ->
      if _hasFrame
        _.insertAndExecuteCell 'cs', "getPrediction model: #{stringify _modelKey}, frame: #{stringify _frameKey}"

    inspect = ->
      if _hasFrame
        _.insertAndExecuteCell 'cs', "inspect getPrediction model: #{stringify _modelKey}, frame: #{stringify _frameKey}"

    modelKey: _modelKey
    frameKey: _frameKey
    modelCategory: prediction.model_category
    isChecked: _isChecked
    hasFrame: _hasFrame
    view: view
    inspect: inspect
  
  _predictionsTable = _.inspect 'predictions', _predictions
  _metricsTable = _.inspect 'metrics', _predictions
  _scoresTable = _.inspect 'scores', _predictions

  comparePredictions = ->
    selectedKeys = ( { model: view.modelKey, frame: view.frameKey } for view in _predictionViews() when view.isChecked())
    _.insertAndExecuteCell 'cs', "getPredictions #{stringify selectedKeys}"

  plotPredictions = ->
    _.insertAndExecuteCell 'cs', _predictionsTable.metadata.plot

  plotScores = ->
    _.insertAndExecuteCell 'cs', _scoresTable.metadata.plot

  plotMetrics = ->
    _.insertAndExecuteCell 'cs', _metricsTable.metadata.plot

  inspectAll = ->
    _.insertAndExecuteCell 'cs', "inspect #{_predictionsTable.metadata.origin}"

  predict = ->
    _.insertAndExecuteCell 'cs', 'predict'

  initialize = (predictions) ->
    _predictionViews map predictions, createPredictionView

#    TODO handle non-binomial models
#    rocCurveConfig =
#      data: _.inspect 'scores', _predictions
#      type: 'line'
#      x: 'FPR'
#      y: 'TPR'
#      color: 'key'
#    _.plot rocCurveConfig, (error, el) ->
#      unless error
#        _rocCurve el

    defer _go

  initialize _predictions
  
  predictionViews: _predictionViews
  hasPredictions: _predictions.length > 0
  comparePredictions: comparePredictions
  canComparePredictions: _canComparePredictions
  checkAllPredictions: _checkAllPredictions
  plotPredictions: plotPredictions
  plotScores: plotScores
  plotMetrics: plotMetrics
  inspect: inspectAll
  predict: predict
  rocCurve: _rocCurve
  template: 'flow-predicts-output'

