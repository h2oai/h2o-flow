{ defer } = require('lodash')

{ stringify } = require('../../core/modules/prelude')

module.exports = (_, _go, key, result) ->
  viewFrame = ->
    _.insertAndExecuteCell 'cs', "getFrameSummary #{stringify key}"

  defer _go

  viewFrame: viewFrame
  template: 'flow-bind-frames-output'
