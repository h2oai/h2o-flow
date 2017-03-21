H2O.ExportModelInput = (_, _go, modelKey, path, opt={}) ->
  _models = signal []
  _selectedModelKey = signal null
  _path = signal null 
  _overwrite = signal if opt.overwrite then yes else no
  _canExportModel = lift _selectedModelKey, _path, (modelKey, path) -> modelKey and path

  exportModel = ->
    _.insertAndExecuteCell 'cs', "exportModel #{stringify _selectedModelKey()}, #{stringify _path()}, overwrite: #{if _overwrite() then 'true' else 'false'}"

  _.requestModels (error, models) ->
    if error
      #TODO handle properly
    else
      _models (model.model_id.name for model in models)
      _selectedModelKey modelKey

  defer _go

  models: _models
  selectedModelKey: _selectedModelKey
  path: _path
  overwrite: _overwrite
  canExportModel: _canExportModel
  exportModel: exportModel
  template: 'flow-export-model-input'

