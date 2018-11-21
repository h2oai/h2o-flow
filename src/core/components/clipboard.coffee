{ map } = require('lodash')

{ lift, link, signal, signals } = require("../modules/dataflow")

SystemClips = [
  'assist'
  'importFiles'
  'getFrames'
  'getModels'
  'getPredictions'
  'getJobs'
  'buildModel'
  'predict'
]

exports.init = (_) ->
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

  addClip = (list, type, input) ->
    list.push createClip list, type, input

  removeClip = (list, clip) ->
    if list is _userClips
      _userClips.remove clip
      saveUserClips()
      _trashClips.push createClip _trashClips, clip.type, clip.input
    else
      _trashClips.remove clip

  emptyTrash = ->
    _trashClips.removeAll()

  loadUserClips = ->
    _.requestObjectExists 'environment', 'clips', (error, exists) ->
      if exists
        _.requestObject 'environment', 'clips', (error, doc) ->
          unless error
            _userClips map doc.clips, (clip) ->
              createClip _userClips, clip.type, clip.input

  serializeUserClips = ->
    version: '1.0.0'
    clips: map _userClips(), (clip) ->
      type: clip.type
      input: clip.input

  saveUserClips = ->
    _.requestPutObject 'environment', 'clips', serializeUserClips(), (error) ->
      if error
        _.alert "Error saving clips: #{error.message}"
      return

  initialize = ->
    _systemClips map SystemClips, (input) -> 
      createClip _systemClips, 'cs', input, no

    link _.ready, ->
      loadUserClips()
      link _.saveClip, (category, type, input) ->
        input = input.trim()
        if input
          if category is 'user'
            addClip _userClips, type, input
            saveUserClips()
          else
            addClip _trashClips, type, input

  initialize()

  systemClips: _systemClips
  systemClipCount: _systemClipCount
  userClips: _userClips
  hasUserClips: _hasUserClips
  userClipCount: _userClipCount
  trashClips: _trashClips
  trashClipCount: _trashClipCount
  hasTrashClips: _hasTrashClips
  emptyTrash: emptyTrash


