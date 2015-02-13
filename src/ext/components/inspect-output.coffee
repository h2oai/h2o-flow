H2O.InspectOutput = (_, _frame) ->
  
  view = ->
    _.insertAndExecuteCell 'cs', "grid inspect #{stringify _frame.label}, #{_frame.metadata.origin}"

  plot = ->
    _.insertAndExecuteCell 'cs', _frame.metadata.plot

  label: _frame.label
  vectors: _frame.vectors
  view: view
  canPlot: if _frame.metadata.plot then yes else no
  plot: plot
  template: 'flow-inspect-output'

