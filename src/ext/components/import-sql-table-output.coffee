H2O.ImportSqlTableOutput = (_, _go, _importResults) ->
  viewData = -> _.insertAndExecuteCell 'cs', "getFrameSummary #{ stringify _importResults.dest.name }"
  defer _go
  viewData: viewData
  template: 'flow-import-sql-table-output'

