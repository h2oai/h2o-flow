{ defer } = require('lodash')

{ stringify } = require('../../core/modules/prelude')

module.exports = (_, _go, result) ->
  viewModel = ->
    _.insertAndExecuteCell 'cs', "getModel #{stringify result.models[0].model_id.name}" 
  defer _go
  viewModel: viewModel
  template: 'flow-import-model-output'


