isExpandable = (type) ->
  switch type
    when 'null', 'undefined', 'Boolean', 'String', 'Number', 'Date', 'RegExp', 'Arguments', 'Function'
      no
    else
      yes
  
isPrimitive = (type) ->
  switch type
    when 'null', 'undefined', 'Boolean', 'String', 'Number', 'Date', 'RegExp'
      yes
    else
      no

previewArray = (array) ->
  ellipsis = if array.length > 5 then ', ...' else ''
  preview = for element in head array, 5
    if isPrimitive type = typeOf element then element else type
  "[#{preview.join ', '}#{ellipsis}]"

previewObject = (object) ->
  count = 0
  previews = []
  ellipsis = ''
  for key, value of object
    valueType = typeOf value
    previews.push "#{key}: #{if isPrimitive valueType then value else valueType}"
    if ++count is 5
      ellipsis = ', ...'
      break 
  "{#{previews.join ', '}#{ellipsis}}" 

preview = (element) ->
  type = typeOf element
  if isPrimitive type
    element
  else
    switch type
      when 'Array'
        previewArray element
      when 'Function', 'Arguments'
        type
      else
        previewObject element

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
      for key, value of object
        expansions.push Flow.ObjectBrowserElement key, value
      _expansions expansions
    _isExpanded not _isExpanded()

  key: key
  preview: preview object
  toggle: toggle
  expansions: _expansions
  isExpanded: _isExpanded
  canExpand: _canExpand

Flow.ObjectBrowser = (key, object) ->
  object: Flow.ObjectBrowserElement key, object
  template: 'flow-object'
