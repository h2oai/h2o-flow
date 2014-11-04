H2O.DataTablesOutput = (_, _tables) ->
  createTableView = (table) ->
    inspect = -> 
      _.insertAndExecuteCell 'cs', table.meta.scan

    name: table.name
    label: table.label
    description: table.description
    columns: table.columns
    inspect: inspect

  hasTables: _tables.length > 0
  tables: map _tables, createTableView
  template: 'flow-data-tables-output'

