H2O.InspectsOutput = (_, _tables) ->
  createTableView = (table) ->
    inspect = -> 
      _.insertAndExecuteCell 'cs', "inspect #{stringify table.label}, #{table.meta.origin}"

    grid = ->
      _.insertAndExecuteCell 'cs', "grid inspect #{stringify table.label}, #{table.meta.origin}"

    plot = ->
      _.insertAndExecuteCell 'cs', table.meta.plot

    label: table.label
    description: table.description
    columns: table.columns
    inspect: inspect
    grid: grid
    canPlot: if table.meta.plot then yes else no
    plot: plot

  hasTables: _tables.length > 0
  tables: map _tables, createTableView
  template: 'flow-inspects-output'

