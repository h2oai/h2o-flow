{ link } = require("./dataflow")

warnOnExit = (e) ->
  # message = 'You have unsaved changes to this notebook.'
  message = 'Warning: you are about to exit Flow.'

  # < IE8 and < FF4
  if e = e ? window.event
    e.returnValue = message

  message

setDirty = ->
  window.onbeforeunload = warnOnExit

setPristine = ->
  window.onbeforeunload = null

exports.init = (_) -> link _.ready, ->
  link _.setDirty, setDirty
  link _.setPristine, setPristine
