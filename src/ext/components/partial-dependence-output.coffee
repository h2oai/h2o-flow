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

  plotPdp = (x, y, table) ->
    _.plot (g) ->
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

  fixColumnValues = (result, name) ->
    if !(typeof result[name][0] == "string")
      orig = result[name]
      result[name] = []
      for i in [0..orig.length-1]
        result[name].push +orig[i]

  transform2dPdpData = (data) ->
    result =
      x: []
      x_domain: null
      y: []
      y_domain: null
      z1: []
      z2: []
      z3: []
    first_val = data[0][0]
    ts_len = 1
    while first_val == data[0][ts_len]
      ts_len++
    for i in [0..ts_len-1]
      result.x.push data[0][ts_len * i]
      result.y.push data[1][i]
    fixColumnValues(result, "x")
    fixColumnValues(result, "y")
    z1_acc = []
    z2_acc = []
    z3_acc = []
    for i in [0..data[0].length-1]
      if i > 0 and i % ts_len == 0
        result.z1.push z1_acc
        z1_acc = []
        result.z2.push z2_acc
        z2_acc = []
        result.z3.push z3_acc
        z3_acc = []
      z1_acc.push +data[2][i]
      z2_acc.push (+data[2][i]) - (+data[3][i])
      z3_acc.push (+data[2][i]) + (+data[3][i])
    result.z1.push z1_acc
    result.z2.push z2_acc
    result.z3.push z3_acc
    return result

  getAxisType = (series) ->
    if typeof series[0] == "string"
      "category"
    else
      "linear"

  plotPdp2d = (response) ->
    _.plotlyPlot (plotly) ->
      (go) ->
        data = transform2dPdpData(response.data)
        data1 =
          x: data.x, y: data.y, z: data.z1
          type: 'surface', opacity: 0.8, showscale: false
          name: "partial dependence"
          contours: { x: { show: true }, y: { show: true } }
        data2 =
          x: data.x, y: data.y, z: data.z2
          type: 'surface', opacity: 0.4, showscale: false
          name: "-dev"
          contours: { x: { show: true }, y: { show: true } }
        data3 =
          x: data.x, y: data.y, z: data.z3
          type: 'surface', opacity: 0.4, showscale: false
          name: "+dev"
          contours: { x: { show: true }, y: { show: true } }
        layout =
          width: 500, height: 400
          margin:
            l: 0, r:0, t: 0, b: 0
          scene:
            xaxis:
              title: { text: response.columns[0].description }
              type: getAxisType(data.x)
            yaxis:
              title: { text: response.columns[1].description }
              type: getAxisType(data.y)
            zaxis: { title: { text: "Partial Dependence" } }
        config =
          displayModeBar: false

        if data.x_cat
          layout.scene.xaxis.type = "category"
        if data.x_cat
          layout.scene.yaxis.type = "category"

        elem = document.createElement('div')
        plotly.newPlot(elem, [data1, data2, data3], layout, config)

        vis =
          element: elem
        go null, vis

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

      if !_result.cols || i >= _result.cols.length
        renderPlot section.plot, plotPdp2d(data)
      else
        renderPlot section.plot, plotPdp(x, y, table)

      renderPlot section.frame, _.plot (g) ->
        g(
          g.select()
          g.from table
        )
      section.isFrameShown = lift _isFrameShown, (value)-> value

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

