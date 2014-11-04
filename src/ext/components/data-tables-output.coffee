H2O.DataTablesOutput = (_, _tables) ->
  createTableView = (table) ->
    inspect = -> table.meta.inspect() if table.meta.inspect

    name: table.name
    label: table.label
    description: table.description
    columns: table.columns
    inspect: inspect

  hasTables: _tables.length > 0
  tables: map _tables, createTableView
  template: 'flow-data-tables-output'

