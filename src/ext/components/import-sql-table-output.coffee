H2O.ImportSqlTableOutput = (_, _go, _importResults) ->
  viewData = ->
    if _importResults.status == 'DONE'
      _.insertAndExecuteCell 'cs', "getFrameSummary #{ stringify _importResults.dest.name }"
    else
      _.insertAndExecuteCell 'cs', "getJob #{ stringify _importResults.key.name }"

  defer _go
  viewData: viewData
  template: 'flow-import-sql-table-output'

