H2O.DataTablesOutput = (_, _tables) ->
  createTableView = (table) ->
    describe = -> 
      _.insertAndExecuteCell 'cs', table.meta.inspect

    inspect = ->
      _.insertAndExecuteCell 'cs', """
      plot 
        type: 'text'
        data: #{table.meta.inspect}
      """

    plot = ->
      _.insertAndExecuteCell 'cs', table.meta.plot

    name: table.name
    label: table.label
    description: table.description
    columns: table.columns
    describe: describe
    inspect: inspect
    canPlot: if table.meta.plot then yes else no
    plot: plot

  hasTables: _tables.length > 0
  tables: map _tables, createTableView
  template: 'flow-data-tables-output'

