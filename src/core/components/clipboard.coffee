SystemClips = [
  'importFiles'
  'getFrames'
  'getModels'
  'getPredictions'
  'getJobs'
  'buildModel'
  'predict'
]
Flow.Clipboard = (_) ->
  lengthOf = (array) -> if array.length then "(#{array.length})" else ''
  _systemClips = signals []
  _systemClipCount = lift _systemClips, lengthOf
  _userClips = signals []
  _userClipCount = lift _userClips, lengthOf
  _hasUserClips = lift _userClips, (clips) -> clips.length > 0
  _trashClips = signals []
  _trashClipCount = lift _trashClips, lengthOf
  _hasTrashClips = lift _trashClips, (clips) -> clips.length > 0

  createClip = (_list, _type, _input, _canRemove=yes) ->
    execute = ->
      _.insertAndExecuteCell _type, _input

    insert = ->
      _.insertCell _type, _input

    remove = ->
      removeClip _list, self if _canRemove

    self =
      type: _type
      input: _input
      execute: execute
      insert: insert
      remove: remove
      canRemove: _canRemove

  removeClip = (list, clip) ->
    if list is _userClips
      _userClips.remove clip
      _trashClips.push createClip _trashClips, clip.type, clip.input
    else
      _trashClips.remove clip

  initialize = ->
    _systemClips map SystemClips, (input) -> 
      createClip _systemClips, 'cs', input, no

    link _.ready, ->
      link _.saveClip, (category, type, input) ->
        input = input.trim()
        if input
          if category is 'user'
            _userClips.push createClip _userClips, type, input
          else
            _trashClips.push createClip _trashClips, type, input

  initialize()

  systemClips: _systemClips
  systemClipCount: _systemClipCount
  userClips: _userClips
  hasUserClips: _hasUserClips
  userClipCount: _userClipCount
  trashClips: _trashClips
  trashClipCount: _trashClipCount
  hasTrashClips: _hasTrashClips


