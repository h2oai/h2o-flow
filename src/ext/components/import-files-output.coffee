H2O.ImportFilesOutput = (_, _go, _importResults) ->
  _allPaths = flatten compact map _importResults, (result) -> result.files
  _canParse = _allPaths.length > 0
  _title = "#{_allPaths.length} / #{_importResults.length} files imported."

  createImportView = (result) ->
    #TODO dels?
    #TODO fails?

    files: result.files
    template: 'flow-import-file-output'

  _importViews = map _importResults, createImportView

  parse = ->
    paths = map _allPaths, stringify
    _.insertAndExecuteCell 'cs', "setupParse [ #{paths.join ','} ]"

  defer _go

  title: _title
  importViews: _importViews
  canParse: _canParse
  parse: parse
  template: 'flow-import-files-output'
  templateOf: (view) -> view.template

