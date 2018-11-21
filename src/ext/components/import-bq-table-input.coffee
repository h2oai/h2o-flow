{ defer } = require('lodash')

{ stringify } = require('../../core/modules/prelude')
{ react, lift, link, signal, signals } = require("../../core/modules/dataflow")

module.exports = (_, _go) ->

  _specifiedProject = signal ''
  _specifiedDataset = signal ''
  _specifiedTable = signal ''
  _specifiedColumns = signal ''
  _exception = signal ''
  _hasErrorMessage = lift _exception, (exception) -> if exception then yes else no

  importSqlTableAction = ->
    opt =
       connection_url: "jdbc:bigquery://https://www.googleapis.com/bigquery/v2;OAuthType=3;ProjectId=#{ _specifiedProject() };"
       table: "`#{ _specifiedDataset() }`.#{ _specifiedTable() }"
       columns: _specifiedColumns()
       username: ''
       password: ''
    _.insertAndExecuteCell 'cs', "importSqlTable #{ stringify opt }"

  defer _go

  hasErrorMessage: _hasErrorMessage #XXX obsolete
  specifiedProject: _specifiedProject
  specifiedDataset: _specifiedDataset
  specifiedTable: _specifiedTable
  specifiedColumns: _specifiedColumns
  exception: _exception
  importSqlTableAction: importSqlTableAction
  template: 'flow-import-bq-table-input'
