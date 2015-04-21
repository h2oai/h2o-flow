H2O.PredictOutput = (_, _go, prediction) ->
  { frame, model } = prediction

  _plots = signals []

  renderPlot = (title, render) ->
    container = signal null

    render (error, vis) ->
      if error
        debug error
      else
        container vis.element

    _plots.push title: title, plot: container

  switch prediction.__meta.schema_type
    when 'ModelMetricsBinomial'
     renderPlot 'ROC Curve', _.plot (g) ->
       g(
         g.path g.position 'FPR', 'TPR'
         g.line(
           g.position (g.value 1), (g.value 0)
           g.strokeColor g.value 'red'
         )
         g.from _.inspect 'Prediction - Thresholds x Metric Scores', prediction
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
  template: 'flow-predict-output'
