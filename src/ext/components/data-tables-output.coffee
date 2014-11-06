H2O.DataTablesOutput = (_, _tables) ->
  createTableView = (table) ->
    inspect = -> 
      _.insertAndExecuteCell 'cs', table.meta.scan

    view = ->
      _.insertAndExecuteCell 'cs', """
      plot 
        type: 'text'
        data: #{table.meta.scan}
      """

    plot = ->
      _.insertAndExecuteCell 'cs', table.meta.plot

    name: table.name
    label: table.label
    description: table.description
    columns: table.columns
    inspect: inspect
    view: view
    canPlot: if table.meta.plot then yes else no
    plot: plot

  hasTables: _tables.length > 0
  tables: map _tables, createTableView
  template: 'flow-data-tables-output'

