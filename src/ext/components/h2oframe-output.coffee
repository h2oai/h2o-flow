{ signal } = require("../../core/modules/dataflow")
{ defer } = require('lodash')

module.exports = (_, _go, _result) ->
  _h2oframeView = signal null
  createH2oFrameView = (result) ->
    h2oframe_id: result.h2oframe_id

  _h2oframeView (createH2oFrameView _result)

  defer _go

  h2oframeView: _h2oframeView
  template: 'flow-h2oframe-output'

