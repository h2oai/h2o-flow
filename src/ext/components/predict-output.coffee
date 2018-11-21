{ defer, map } = require('lodash')

{ stringify } = require('../../core/modules/prelude')
{ react, lift, link, signal, signals } = require("../../core/modules/dataflow")
util = require('../../core/modules/util')

module.exports = (_, _go, modelKey, frameKey, predictionFrame, prediction) ->
  if prediction
    { frame, model } = prediction

  predictionFrameKey = predictionFrame.name
  _plots = signals []
  _canInspect = if prediction.__meta then yes else no

  renderPlot = (title, prediction, render) ->
    container = signal null

    combineWithFrame = ->
      targetFrameName = "combined-#{predictionFrameKey}"

      _.insertAndExecuteCell 'cs', "bindFrames #{stringify targetFrameName}, [ #{stringify predictionFrameKey}, #{stringify frameKey} ]"

    render (error, vis) ->
      if error
        console.debug error
      else
        $('a', vis.element).on 'click', (e) ->
          $a = $ e.target
          switch $a.attr 'data-type'
            when 'frame'
              _.insertAndExecuteCell 'cs', "getFrameSummary #{stringify $a.attr 'data-key'}"
            when 'model'
              _.insertAndExecuteCell 'cs', "getModel #{stringify $a.attr 'data-key'}"
        container vis.element

    _plots.push
      title: title
      plot: container
      combineWithFrame: combineWithFrame
      canCombineWithFrame: title is 'Prediction'

  if prediction
    switch prediction.__meta?.schema_type
      when 'ModelMetricsBinomial', 'ModelMetricsBinomialGLM'
        if table = _.inspect 'Prediction - Metrics for Thresholds', prediction
          renderPlot 'ROC Curve', prediction, _.plot (g) ->
            g(
              g.path g.position 'fpr', 'tpr'
              g.line(
                g.position (g.value 1), (g.value 0)
                g.strokeColor g.value 'red'
              )
              g.from table
              g.domainX_HACK 0, 1
              g.domainY_HACK 0, 1
            )

    for tableName in _.ls prediction
      cmTableName = prediction?.cm?.table?.name
      if tableName is 'Prediction - cm' # Skip the empty section
          continue
      else if cmTableName? and tableName? and tableName.indexOf(cmTableName, tableName.length - cmTableName.length) != -1
        _plots.push util.renderMultinomialConfusionMatrix("Prediction - Confusion Matrix", prediction.cm.table)
      else
        if table = _.inspect tableName, prediction
            if table.indices.length > 1
              renderPlot tableName, prediction, _.plot (g) ->
                g(
                  g.select()
                  g.from table
                )
            else
              renderPlot tableName, prediction, _.plot (g) ->
                g(
                  g.select 0
                  g.from table
                )

  inspect = ->
    #XXX get this from prediction table
    _.insertAndExecuteCell 'cs', "inspect getPrediction model: #{stringify model.name}, frame: #{stringify frame.name}"

  defer _go

  plots: _plots
  inspect: inspect
  canInspect: _canInspect
  template: 'flow-predict-output'
