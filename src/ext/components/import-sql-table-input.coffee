H2O.ImportSqlTableInput = (_, _go) ->

  _specifiedUrl = signal ''
  _specifiedTable = signal ''
  _specifiedColumns = signal ''
  _specifiedUsername = signal ''
  _specifiedPassword = signal ''
  _exception = signal ''
  _hasErrorMessage = lift _exception, (exception) -> if exception then yes else no

  importSqlTableAction = ->
    opt =
       connection_url: _specifiedUrl()
       table: _specifiedTable()
       columns: _specifiedColumns()
       username: _specifiedUsername()
       password: _specifiedPassword()
    _.insertAndExecuteCell 'cs', "importSqlTable #{ stringify opt }"

  defer _go

  hasErrorMessage: _hasErrorMessage #XXX obsolete
  specifiedUrl: _specifiedUrl
  specifiedTable: _specifiedTable
  specifiedColumns: _specifiedColumns
  specifiedUsername: _specifiedUsername
  specifiedPassword: _specifiedPassword
  exception: _exception
  importSqlTableAction: importSqlTableAction
  template: 'flow-import-sql-table-input'
