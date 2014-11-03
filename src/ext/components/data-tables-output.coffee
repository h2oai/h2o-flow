H2O.DataTablesOutput = (_, _tables) ->

  createTableView = (table) ->

    inspect = -> 
      debug 'inspect', table
      #_.insertAndExecuteCell 'cs', "data '#{table.name}', getFrame "

    name: table.name
    label: table.label
    description: table.description
    inspect: inspect

  hasTables: _tables.length > 0
  tables: map _tables, createTableView
  template: 'flow-data-tables-output'

