traceCauses = (error, causes) ->
  causes.push error.message
  traceCauses error.cause, causes if error.cause
  return causes

Flow.Failure = (error) ->
  causes = traceCauses error, []
  message = shift causes
  _isStackVisible = signal no
  toggleStack = -> _isStackVisible not _isStackVisible()

  message: message
  stack: error.stack
  causes: causes
  isStackVisible: _isStackVisible
  toggleStack: toggleStack
  template: 'flow-failure'

