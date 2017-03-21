H2O.ImportFilesOutput = (_, _go, _importResults) ->
  _allFrames = flatten compact map _importResults, (result) -> result.destination_frames
  _canParse = _allFrames.length > 0
  _title = "#{_allFrames.length} / #{_importResults.length} files imported."

  createImportView = (result) ->
    #TODO dels?
    #TODO fails?

    files: result.files
    template: 'flow-import-file-output'

  _importViews = map _importResults, createImportView

  parse = ->
    paths = map _allFrames, stringify
    _.insertAndExecuteCell 'cs', "setupParse source_frames: [ #{paths.join ','} ]"

  defer _go

  title: _title
  importViews: _importViews
  canParse: _canParse
  parse: parse
  template: 'flow-import-files-output'
  templateOf: (view) -> view.template

