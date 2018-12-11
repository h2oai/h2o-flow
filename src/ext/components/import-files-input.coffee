{ defer, map, some, throttle } = require('lodash')

{ stringify } = require('../../core/modules/prelude')
{ act, react, lift, link, signal, signals } = require("../../core/modules/dataflow")
util = require('../../core/modules/util')

module.exports = (_, _go) ->
  #
  # Search files/dirs
  #
  _specifiedPath = signal ''
  _exception = signal ''
  _hasErrorMessage = lift _exception, (exception) -> if exception then yes else no

  tryImportFiles = ->
    specifiedPath = _specifiedPath()
    _.requestFileGlob specifiedPath, -1, (error, result) ->
      if error
        _exception error.stack
      else
        _exception ''
        #_go 'confirm', result
        processImportResult result

  #
  # File selection 
  #
  _importedFiles = signals []
  _importedFileCount = lift _importedFiles, (files) -> if files.length then "Found #{util.describeCount files.length, 'file'}:" else ''
  _hasImportedFiles = lift _importedFiles, (files) -> files.length > 0
  _hasUnselectedFiles = lift _importedFiles, (files) -> some files, (file) -> not file.isSelected()
  _selectedFiles = signals []
  _selectedFilesDictionary = lift _selectedFiles, (files) ->
    dictionary = {}
    for file in files
      dictionary[file.path] = yes
    dictionary
  _selectedFileCount = lift _selectedFiles, (files) -> 
    if files.length
      "#{util.describeCount files.length, 'file'} selected:"
    else
      "(No files selected)"

  _hasSelectedFiles = lift _selectedFiles, (files) -> files.length > 0

  importFiles = (files) ->
    paths = map files, (file) -> stringify file.path
    _.insertAndExecuteCell 'cs', "importFiles [ #{ paths.join ',' } ]"

  importSelectedFiles = -> importFiles _selectedFiles()

  createSelectedFileItem = (path) ->
    self =
      path: path
      deselect: ->
        _selectedFiles.remove self
        for file in _importedFiles() when file.path is path
          file.isSelected no
        return

  createFileItem = (path, isSelected) ->
    self =
      path: path
      isSelected: signal isSelected
      select: ->
        _selectedFiles.push createSelectedFileItem self.path
        self.isSelected yes 

    act self.isSelected, (isSelected) ->
      _hasUnselectedFiles some _importedFiles(), (file) -> not file.isSelected()

    self

  createFileItems = (result) ->
    map result.matches, (path) ->
      createFileItem path, _selectedFilesDictionary()[path]

  listPathHints = (query, sync, process) ->
    _.requestFileGlob query, 10, (error, result) ->
      unless error
        process map result.matches, (value) -> value: value

  selectAllFiles = ->
    dict = {}
    for file in _selectedFiles()
      dict[file.path] = yes
    for file in _importedFiles() when not dict[file.path]
      file.select()
    return

  deselectAllFiles = ->
    _selectedFiles []
    for file in _importedFiles()
      file.isSelected no
    return
  
  processImportResult = (result) -> 
    files = createFileItems result
    _importedFiles files

  defer _go

  specifiedPath: _specifiedPath
  hasErrorMessage: _hasErrorMessage #XXX obsolete
  exception: _exception
  tryImportFiles: tryImportFiles
  listPathHints: throttle listPathHints, 100
  hasImportedFiles: _hasImportedFiles
  importedFiles: _importedFiles
  importedFileCount: _importedFileCount
  selectedFiles: _selectedFiles
  selectAllFiles: selectAllFiles
  deselectAllFiles: deselectAllFiles
  hasUnselectedFiles: _hasUnselectedFiles
  hasSelectedFiles: _hasSelectedFiles
  selectedFileCount: _selectedFileCount
  importSelectedFiles: importSelectedFiles
  template: 'flow-import-files'

