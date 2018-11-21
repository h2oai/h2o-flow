{ defer, map } = require('lodash')

{ stringify } = require('../../core/modules/prelude')

module.exports = (_, _go, _splitFrameResult) ->

  computeRatios = (sourceRatios) ->
    total = 0
    ratios = for ratio in sourceRatios
      total += ratio
      ratio
    ratios.push 1 - total
    ratios

  createFrameView = (key, ratio) ->
    view = ->
      _.insertAndExecuteCell 'cs', "getFrameSummary #{stringify key}"

    self =
      key: key
      ratio: ratio
      view: view

  _ratios = computeRatios _splitFrameResult.ratios
  _frames = for key, index in _splitFrameResult.keys
    createFrameView key, _ratios[index]

  defer _go

  frames: _frames
  template: 'flow-split-frame-output'
