{ defer } = require('lodash')

{ stringify } = require('../../core/modules/prelude')
{ react, lift, link, signal, signals } = require("../../core/modules/dataflow")

module.exports = (_, _go, path, opt={}) ->
  _path = signal path 
  _overwrite = signal if opt.overwrite then yes else no
  _canImportModel = lift _path, (path) -> path and path.length

  importModel = ->
    _.insertAndExecuteCell 'cs', "importModel #{stringify _path()}, overwrite: #{if _overwrite() then 'true' else 'false'}"

  defer _go

  path: _path
  overwrite: _overwrite
  canImportModel: _canImportModel
  importModel: importModel
  template: 'flow-import-model-input'

