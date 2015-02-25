Flow.FileOpenDialog = (_, _go) ->
  extension = '.flow'
  _overwrite = signal no
  _form = signal null
  _file = signal null

  validateFileExtension = (filename) ->
    -1 isnt filename.indexOf extension, filename.length - extension.length

  getFileBaseName = (filename) ->
    filename.substr 0, filename.length - extension.length

  _canAccept = lift _file, (file) ->
    if file?.name
      validateFileExtension file.name  
    else
      no

  checkIfNameIsInUse = (name, go) ->
    _.requestObject 'notebook', name, (error) ->
      go if error then no else yes

  uploadFile = (basename) ->
    _.requestUploadObject 'notebook', basename, (new FormData _form()), (error, filename) ->
      _go error: error, filename: filename

  accept = ->
    if file = _file()
      basename = getFileBaseName file.name
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
