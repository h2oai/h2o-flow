H2O.SplitFrameOutput = (_, _go, _splitFrameResult) ->

  computeRatios = (sourceRatios) ->
    total = 0
    ratios = for ratio in sourceRatios
      total += ratio
      ratio
    ratios.push 1 - total
    ratios

  createFrameView = (key, ratio) ->
    view = ->
      _.insertAndExecuteCell 'cs', "getFrame #{stringify key}"

    self =
      key: key
      ratio: ratio
      view: view

  _ratios = computeRatios _splitFrameResult.ratios
  _frames = for key, index in _splitFrameResult.dest_keys
    createFrameView key.name, _ratios[index]

  defer _go

  frames: _frames
  template: 'flow-split-frame-output'
