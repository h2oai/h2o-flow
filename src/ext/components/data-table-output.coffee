H2O.DataTableOutput = (_, _table) ->
  
  view = ->
    _.insertAndExecuteCell 'cs', """
    plot
      data: #{_table.meta.scan}
      type: 'text'
    """

  label: _table.label
  columns: _table.columns
  view: view
  template: 'flow-data-table-output'

