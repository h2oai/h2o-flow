H2O.InspectOutput = (_, _table) ->
  
  view = ->
    _.insertAndExecuteCell 'cs', "grid inspect #{stringify _table.name}, #{_table.meta.origin}"

  plot = ->
    _.insertAndExecuteCell 'cs', _table.meta.plot

  name: _table.name
  columns: _table.columns
  view: view
  canPlot: if _table.meta.plot then yes else no
  plot: plot
  template: 'flow-inspect-output'

