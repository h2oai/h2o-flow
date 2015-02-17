isExpandable = (type) ->
  switch type
    when 'null', 'undefined', 'Boolean', 'String', 'Number', 'Date', 'RegExp', 'Arguments', 'Function'
      no
    else
      yes

previewArray = (array) ->
  ellipsis = if array.length > 5 then ', ...' else ''
  previews = for element in head array, 5
    preview element
  "[#{previews.join ', '}#{ellipsis}]"

previewObject = (object) ->
  count = 0
  previews = []
  ellipsis = ''
  for key, value of object when key isnt '_flow_'
    previews.push "#{key}: #{preview value}"
    if ++count is 5
      ellipsis = ', ...'
      break 
  "{#{previews.join ', '}#{ellipsis}}" 

preview = (element, recurse=no) ->
  type = typeOf element
  switch type
    when 'Boolean', 'String', 'Number', 'Date', 'RegExp'
      element
    when 'undefined', 'null', 'Function', 'Arguments'
      type
    when 'Array'
      if recurse then previewArray element else type
    else
      if recurse then previewObject element else type

#TODO slice large arrays
Flow.ObjectBrowserElement = (key, object) ->
  _expansions = signal null
  _isExpanded = signal no
  _type = typeOf object
  _canExpand = isExpandable _type
  toggle = ->
    return unless _canExpand
    if _expansions() is null
      expansions = []
      for key, value of object when key isnt '_flow_'
        expansions.push Flow.ObjectBrowserElement key, value
      _expansions expansions
    _isExpanded not _isExpanded()

  key: key
  preview: preview object, yes
  toggle: toggle
  expansions: _expansions
  isExpanded: _isExpanded
  canExpand: _canExpand

Flow.ObjectBrowser = (key, object, _go) ->

  defer _go

  object: Flow.ObjectBrowserElement key, object
  template: 'flow-object'
