{ defer } = require('lodash')

module.exports = (_, _go, _keys) ->

  defer _go

  hasKeys: _keys.length > 0
  keys: _keys
  template: 'flow-delete-objects-output' 
