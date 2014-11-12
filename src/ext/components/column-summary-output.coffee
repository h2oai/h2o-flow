H2O.ColumnSummaryOutput = (_, frameKey, frame, columnName) ->
  column = head frame.columns

  _characteristicsPlot = signal null

  _characteristicsTable = _.inspect 'characteristics', frame
  _characteristicsPlotConfig =
    data: _characteristicsTable
    type: 'interval'
    x: Flow.Plot.stack 'count'
    y: 'label'

  Flow.Plot _characteristicsPlotConfig, (error, plot) ->
    unless error
      _characteristicsPlot plot

  inspect = ->
    _.insertAndExecuteCell 'cs', "inspect getColumnSummary #{stringify frameKey}, #{stringify columnName}"


  label: column.label
  characteristicsPlot: _characteristicsPlot
  inspect: inspect
  template: 'flow-column-summary-output'
