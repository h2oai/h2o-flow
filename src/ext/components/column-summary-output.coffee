H2O.ColumnSummaryOutput = (_, frameKey, frame, columnName) ->
  column = head frame.columns

  histogram = _.scan 'histogram', frame

  scan = ->
    _.insertAndExecuteCell 'cs', "scan getColumnSummary #{stringify frameKey}, #{stringify columnName}"

  #
  # plot
  #   data: histogram, 
  #   mark: 'interval'
  #   x: [ 'intervalStart', 'intervalEnd' ]
  #   y: 'count'
  #

  label: column.label
  scan: scan
  template: 'flow-column-summary-output'
