{ signal } = require('../modules/dataflow')

traceCauses = (error, causes) ->
  causes.push error.message
  traceCauses error.cause, causes if error.cause
  return causes

module.exports = (_, error) ->
  causes = traceCauses error, []
  message = causes.shift()
  _isStackVisible = signal no
  toggleStack = -> _isStackVisible not _isStackVisible()

  _.trackException message + '; ' + causes.join '; '

  message: message
  stack: error.stack
  causes: causes
  isStackVisible: _isStackVisible
  toggleStack: toggleStack
  template: 'flow-failure'
