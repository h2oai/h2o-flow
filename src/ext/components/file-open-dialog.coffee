{ react, lift, link, signal, signals } = require("../../core/modules/dataflow")

util = require('../modules/util')

module.exports = (_, _go) ->
  _overwrite = signal no
  _form = signal null
  _file = signal null

  _canAccept = lift _file, (file) ->
    if file?.name
      util.validateFileExtension file.name, '.flow'
    else
      no

  checkIfNameIsInUse = (name, go) ->
    _.requestObjectExists 'notebook', name, (error, exists) -> go exists

  uploadFile = (basename) ->
    _.requestUploadObject 'notebook', basename, (new FormData _form()), (error, filename) ->
      _go error: error, filename: filename

  accept = ->
    if file = _file()
      basename = util.getFileBaseName file.name, '.flow'
      if _overwrite()
        uploadFile basename
      else
        checkIfNameIsInUse basename, (isNameInUse) ->
          if isNameInUse
            _overwrite yes     
          else
            uploadFile basename

  decline = -> _go null

  form: _form
  file: _file
  overwrite: _overwrite
  canAccept: _canAccept
  accept: accept
  decline: decline
  template: 'file-open-dialog'
