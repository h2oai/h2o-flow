Flow.ApplicationContext = (_) ->
  _.ready = do slots
  _.selectCell = do slot
  _.insertCell = do slot
  _.insertAndExecuteCell = do slot
  _.showHelp = do slot
  _.showClipboard = do slot
  _.saveClip = do slot

