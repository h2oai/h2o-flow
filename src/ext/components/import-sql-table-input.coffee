H2O.ImportSqlTableInput = (_, _go) ->
  _specifiedUrl = signal ''
  _specifiedTable = signal ''
  _specifiedColumns = signal ''
  _specifiedUsername = signal ''
  _specifiedPassword = signal ''
  _exception = signal ''
  _hasErrorMessage = lift _exception, (exception) -> if exception then yes else no

  # This is a shim for ko binding handlers to attach methods to
  # The ko 'autoResize' custom binding attaches an autoResize() method to this.
  _actions = {}

  importSqlTableAction = ->
    encryptedPassword = H2O.Util.encryptPassword _specifiedPassword()

    opt =
       connection_url: _specifiedUrl()
       columns: _specifiedColumns()
       username: _specifiedUsername()
       password: encryptedPassword

    if _specifiedTable().trim().toLowerCase().startsWith("select")
      opt.select_query = _specifiedTable().trim()
    else
      opt.table = _specifiedTable()

    _.insertAndExecuteCell 'cs', "importSqlTable #{ stringify opt }"

  defer _go

  hasErrorMessage: _hasErrorMessage #XXX obsolete
  specifiedUrl: _specifiedUrl
  specifiedTable: _specifiedTable
  specifiedColumns: _specifiedColumns
  specifiedUsername: _specifiedUsername
  specifiedPassword: _specifiedPassword
  exception: _exception
  _actions: _actions
  autoResize: -> _actions.autoResize()
  importSqlTableAction: importSqlTableAction
  template: 'flow-import-sql-table-input'
