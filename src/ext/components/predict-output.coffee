H2O.PredictOutput = (_, _go, prediction) ->
  if prediction
    { frame, model } = prediction

  _plots = signals []
  _canInspect = if prediction.__meta then yes else no

  renderPlot = (title, render) ->
    container = signal null

    render (error, vis) ->
      if error
        debug error
      else
        $('a', vis.element).on 'click', (e) ->
          $a = $ e.target
          switch $a.attr 'data-type'
            when 'frame'
              _.insertAndExecuteCell 'cs', "getFrameSummary #{stringify $a.attr 'data-key'}"
            when 'model'
              _.insertAndExecuteCell 'cs', "getModel #{stringify $a.attr 'data-key'}"
        container vis.element

    _plots.push title: title, plot: container

  if prediction
    switch prediction.__meta?.schema_type
      when 'ModelMetricsBinomial'
        if table = _.inspect 'Prediction - Metrics for Thresholds', prediction
          renderPlot 'ROC Curve', _.plot (g) ->
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
      if table = _.inspect tableName, prediction
        if table.indices.length > 1
          renderPlot tableName, _.plot (g) ->
            g(
              g.select()
              g.from table
            )
        else
          renderPlot tableName, _.plot (g) ->
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
