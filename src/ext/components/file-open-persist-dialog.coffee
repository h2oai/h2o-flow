Flow.FileOpenPersistDialog = (_, _go) ->
  _overwrite = signal no
  _form = signal null
  _file = signal null
  _specifiedPath = signal ''
  _flow_dir = ''
  _get_flow_dir = ->
    _.requestFlowDir (error, result) ->
      unless error
        _flow_dir = result.flow_dir
  _get_flow_dir()

  listPathHints = (query, process) ->
    if _flow_dir == ''
      _get_flow_dir()
    prefix = "#{_flow_dir}/notebook/"
    if query == '*'
      filter = prefix
    else
      filter = "#{prefix}#{query}"
    console.log(filter)
    _.requestFileGlob filter, 100, (error, result) ->
      unless error
        process map result.matches, (value) -> value: value.substr(prefix.length)

  _canAccept = ->
    specifiedPath = _specifiedPath()
    return specifiedPath?

  checkIfNameIsInUse = (name, go) ->
    _.requestObjectExists 'notebook', name, (error, exists) -> go exists

  uploadFlow = (path, basename) ->
    flow_dir = _flow_dir
    _.requestFlowLoadPersist basename, "#{flow_dir}/notebook/#{path}", (error, result) ->
        _go error: error, filename: basename

  loadNotebook = ->
    if specifiedPath = _specifiedPath()
      basename = H2O.Util.getFileBaseName specifiedPath, ''
      if _overwrite()
        uploadFlow specifiedPath, basename
      else
        checkIfNameIsInUse basename, (isNameInUse) ->
          if isNameInUse
            _overwrite yes
          else
            uploadFlow specifiedPath, basename

  decline = -> _go null

  form: _form
  file: _file
  specifiedPath: _specifiedPath
  overwrite: _overwrite
  canAccept: _canAccept
  listPathHints: listPathHints
  loadNotebook: loadNotebook
  decline: decline
  template: 'file-open-persist-dialog'
