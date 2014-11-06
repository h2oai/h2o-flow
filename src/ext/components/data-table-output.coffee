H2O.DataTableOutput = (_, _table) ->
  
  view = ->
    _.insertAndExecuteCell 'cs', """
    plot
      data: #{_table.meta.inspect}
      type: 'text'
    """

  plot = ->
    _.insertAndExecuteCell 'cs', _table.meta.plot

  label: _table.label
  columns: _table.columns
  view: view
  canPlot: if _table.meta.plot then yes else no
  plot: plot
  template: 'flow-data-table-output'

