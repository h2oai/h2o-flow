H2O.ColumnSummaryOutput = (_, frameKey, frame, columnName) ->
  column = head frame.columns

  histogram = _.inspect(frame).histogram

  inspect = ->
    _.insertAndExecuteCell 'cs', "inspect getColumnSummary #{stringify frameKey}, #{stringify columnName}"

  #
  # plot
  #   data: histogram, 
  #   mark: 'interval'
  #   x: [ 'intervalStart', 'intervalEnd' ]
  #   y: 'count'
  #

  label: column.label
  inspect: inspect
  template: 'flow-column-summary-output'
