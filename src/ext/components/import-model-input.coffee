H2O.ImportModelInput = (_, _go, modelKey, path, opt={}) ->
  _modelKey = signal modelKey
  _path = signal path 
  _overwrite = signal if opt.overwrite then yes else no
  _canImportModel = lift _modelKey, _path, (modelKey, path) -> modelKey and path

  importModel = ->
    _.insertAndExecuteCell 'cs', "importModel #{stringify _modelKey()}, #{stringify _path()}, overwrite: #{if _overwrite() then 'true' else 'false'}"

  defer _go

  modelKey: _modelKey
  path: _path
  overwrite: _overwrite
  canImportModel: _canImportModel
  importModel: importModel
  template: 'flow-import-model-input'

