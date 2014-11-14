Flow.ApplicationContext = (_) ->
  _.ready = do slots
  _.status = do slot
  _.selectCell = do slot
  _.insertCell = do slot
  _.insertAndExecuteCell = do slot
  _.showHelp = do slot
  _.showOutline = do slot
  _.showBrowser = do slot
  _.showClipboard = do slot
  _.saveClip = do slot
  _.loadNotebook = do slot
  _.storeNotebook = do slot

