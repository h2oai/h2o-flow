H2O.ImportFilesOutput = (_, _importResults) ->
  _allKeys = flatten compact map _importResults, ( [ error, result ] ) ->
    if error then null else result.keys
  _canParse = _allKeys.length > 0
  _title = "#{_allKeys.length} / #{_importResults.length} files imported."

  createImportView = (result) ->
    #TODO dels?
    #TODO fails?

    keys: result.keys
    template: 'flow-import-file-output'

  _importViews = map _importResults, ( [error, result] ) ->
    if error
      #XXX untested
      Flow.Failure new Flow.Error 'Error importing file', error
    else
      createImportView result

  parse = ->
    paths = map _allKeys, stringify
    _.insertAndExecuteCell 'cs', "setupParse [ #{paths.join ','} ]"

  title: _title
  importViews: _importViews
  canParse: _canParse
  parse: parse
  template: 'flow-import-files-output'
  templateOf: (view) -> view.template

