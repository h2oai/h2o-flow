Flow.FileOpenDialog = (_, extension, _go) ->
  _form = signal null
  _file = signal null
  _canAccept = lift _file, (file) ->
    if file?.name
      -1 isnt file.name.indexOf extension, file.name.length - extension.length
    else
      no

  accept = -> _go
    formData: new FormData _form()
    file: _file()

  decline = -> _go null

  form: _form
  file: _file
  canAccept: _canAccept
  accept: accept
  decline: decline
  template: 'file-open-dialog'
