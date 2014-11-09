H2O.InspectOutput = (_, _table) ->
  
  view = ->
    _.insertAndExecuteCell 'cs', "grid inspect #{stringify _table.label}, #{_table.meta.origin}"

  plot = ->
    _.insertAndExecuteCell 'cs', _table.meta.plot

  label: _table.label
  variables: _table.variables
  view: view
  canPlot: if _table.meta.plot then yes else no
  plot: plot
  template: 'flow-inspect-output'

