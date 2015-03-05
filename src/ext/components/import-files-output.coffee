H2O.ImportFilesOutput = (_, _go, _importResults) ->
  _allKeys = flatten compact map _importResults, ( [ error, result ] ) ->
    if error then null else result.keys
  _canParse = _allKeys.length > 0
  _canBuildModel = _allKeys.length is 1
  _title = "#{_allKeys.length} / #{_importResults.length} files imported."

  createImportView = (result) ->
    #TODO dels?
    #TODO fails?

    keys: result.keys
    template: 'flow-import-file-output'

  _importViews = map _importResults, ( [error, result] ) ->
    if error
      #XXX untested
      Flow.Failure _, new Flow.Error 'Error importing file', error
    else
      createImportView result

  parse = ->
    paths = map _allKeys, stringify
    _.insertAndExecuteCell 'cs', "setupParse [ #{paths.join ','} ]"

  buildModel = ->
    _.insertAndExecuteCell 'cs', "assist buildModel, null, training_frame: #{stringify head _allKeys}"

  defer _go

  title: _title
  importViews: _importViews
  canParse: _canParse
  parse: parse
  canBuildModel: _canBuildModel
  buildModel: buildModel
  template: 'flow-import-files-output'
  templateOf: (view) -> view.template

