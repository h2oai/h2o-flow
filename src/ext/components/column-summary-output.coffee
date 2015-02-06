H2O.ColumnSummaryOutput = (_, frameKey, frame, columnName) ->
  column = head frame.columns

  debug frame

  _characteristicsPlot = signal null
  _summaryPlot = signal null
  _distributionPlot = signal null
  _domainPlot = signal null

  renderPlot = (target, render) ->
    render (error, vis) ->
      if error
        debug error
      else
        target vis.element

  if table = _.inspect 'characteristics', frame
    renderPlot _characteristicsPlot, _.plot (g) ->
      g(
        g.rect(
          g.position g.stack(g.avg('percent'), 0), 'All'
          g.fillColor 'characteristic'
        )
        g.groupBy g.factor(g.value 'All'), 'characteristic'
        g.from table
      )

  if table = _.inspect 'distribution', frame
    renderPlot _distributionPlot, _.plot (g) ->
      g(
        g.rect(
          g.position 'interval', 'count'
          g.width g.value 1
        )
        g.from table
      )

  if table = _.inspect 'summary', frame
    renderPlot _summaryPlot, _.plot (g) ->
      g(
        g.schema(
          g.position 'min', 'q1', 'q2', 'q3', 'max', 'column'
        )
        g.from table
      )

  if table = _.inspect 'domain', frame
    renderPlot _domainPlot, _.plot (g) ->
      g(
        g.rect(
          g.position 'count', 'label'
        )
        g.from table
      )

  inspect = ->
    _.insertAndExecuteCell 'cs', "inspect getColumnSummary #{stringify frameKey}, #{stringify columnName}"

  label: column.label
  characteristicsPlot: _characteristicsPlot
  summaryPlot: _summaryPlot
  distributionPlot: _distributionPlot
  domainPlot: _domainPlot
  inspect: inspect
  template: 'flow-column-summary-output'
