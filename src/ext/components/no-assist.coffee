{ defer, map } = require('lodash')

module.exports = (_, _go) ->
  defer _go
  showAssist: -> _.insertAndExecuteCell 'cs', 'assist'
  template: 'flow-no-assist'

