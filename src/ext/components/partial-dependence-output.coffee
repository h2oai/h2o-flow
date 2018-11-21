{ defer, map } = require('lodash')

{ stringify } = require('../../core/modules/prelude')
{ react, lift, link, signal, signals } = require("../../core/modules/dataflow")

module.exports = (_, _go, _result) ->

  _destinationKey = _result.destination_key
  _modelId = _result.model_id.name
  _frameId = _result.frame_id.name
  _isFrameShown = signal no

  renderPlot = (target, render) ->
    render (error, vis) ->
      if error
        console.debug error
      else
        target vis.element

  _plots = [] # Hold as many plots as present in the result.
  for data, i in _result.partial_dependence_data
    if table = _.inspect "plot#{i+1}", _result
      x = data.columns[0].name
      y = data.columns[1].name

      _plots.push section = 
        title: "#{x} vs #{y}"
        plot: signal null
        frame: signal null
        isFrameShown: signal no

      renderPlot section.plot, _.plot (g) ->
        g(
          g.path(
            g.position x, y
            g.strokeColor g.value '#1f77b4'
          )
          g.point(
            g.position x, y
            g.strokeColor g.value '#1f77b4'
          )
          g.from table
        )
      renderPlot section.frame, _.plot (g) ->
        g(
          g.select()
          g.from table
        )

      section.isFrameShown = lift _isFrameShown, (value)-> value

  # _partialDependencePlots = map _result.partial_dependence_data, (item) ->
  # 	description: item.columns[0].description
  # 	plot: item.data
  # 	table: item.data

  # _partialDependenceData = _result.partial_dependence_data

  _viewFrame = ->
    _.insertAndExecuteCell 'cs', "requestPartialDependenceData #{stringify _destinationKey}"

  defer _go

  destinationKey: _destinationKey
  modelId: _modelId
  frameId: _frameId
  plots: _plots
  isFrameShown: _isFrameShown
  viewFrame: _viewFrame
  template: 'flow-partial-dependence-output'

