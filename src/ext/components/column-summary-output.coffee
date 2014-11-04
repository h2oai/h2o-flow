H2O.ColumnSummaryOutput = (_, frameKey, frame) ->
  column = head frame.columns

  histogram = _.scan 'histogram', frame

  #
  # plot
  #   data: histogram, 
  #   mark: 'interval'
  #   x: [ 'intervalStart', 'intervalEnd' ]
  #   y: 'count'
  #

  label: column.label
  template: 'flow-column-summary-output'
