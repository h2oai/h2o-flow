{ defer } = require('lodash')

{ stringify } = require('../../core/modules/prelude')
{ react, lift, link, signal, signals } = require("../../core/modules/dataflow")

module.exports = (_, _go, modelKey, path, opt={}) ->
  _models = signal []
  _rawModels = signal []
  _selectedModelKey = signal null
  _path = signal null
  _overwrite = signal if opt.overwrite then yes else no
  _hasMojo = lift _selectedModelKey, (modelKey) ->
    for model in _rawModels()
      if model.model_id.name == modelKey and model.have_mojo == true
          return true
    return false

  _canExportModel = lift _selectedModelKey, _path, (modelKey, path) -> modelKey and path

  _canExportModelMojo = lift _canExportModel, _hasMojo, (exportable, hasMojo) -> exportable and hasMojo

  _export = (format) ->
    _.insertAndExecuteCell 'cs', "exportModel #{stringify _selectedModelKey()}, #{stringify _path()}, overwrite: #{if _overwrite() then 'true' else 'false'}, format: \"#{ format }\""

  exportModel = -> _export "bin"

  exportModelMojo = -> _export "mojo"

  _.requestModels (error, models) ->
    if error
      #TODO handle properly
    else
      _models (model.model_id.name for model in models)
      _rawModels models
      _selectedModelKey modelKey

  defer _go

  models: _models
  selectedModelKey: _selectedModelKey
  path: _path
  overwrite: _overwrite
  canExportModel: _canExportModel
  canExportModelMojo: _canExportModelMojo
  exportModel: exportModel
  exportModelMojo: exportModelMojo
  template: 'flow-export-model-input'

