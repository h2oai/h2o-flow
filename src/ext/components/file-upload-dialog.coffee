{ link, signal, lift } = require("../../core/modules/dataflow")

module.exports = (_, _go) ->
  _form = signal null
  _file = signal null

  uploadFile = (key) ->
    _.requestUploadFile key, (new FormData _form()), (error, result) ->
      _go error: error, result: result

  accept = ->
    if file = _file()
      uploadFile file.name

  decline = -> _go null

  form: _form
  file: _file
  accept: accept
  decline: decline
  template: 'file-upload-dialog'
