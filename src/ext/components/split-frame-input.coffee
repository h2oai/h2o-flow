{ defer, map, sortBy, uniq } = require('lodash')

{ stringify } = require('../../core/modules/prelude')
{ react, lift, link, signal, signals } = require("../../core/modules/dataflow")

module.exports = (_, _go, _frameKey) ->
  _frames = signal []
  _frame = signal null
  _lastSplitRatio = signal 1
  format4f = (value) -> value.toPrecision(4).replace /0+$/, '0'
  _lastSplitRatioText = lift _lastSplitRatio, (ratio) -> if isNaN ratio then ratio else format4f ratio
  _lastSplitKey = signal ''
  _splits = signals []
  _seed = signal (Math.random() * 1000000) | 0
  react _splits, -> updateSplitRatiosAndNames()
  _validationMessage = signal ''

  collectRatios = ->
    for entry in _splits()
      entry.ratio()

  collectKeys = ->
    splitKeys = for entry in _splits()
      entry.key().trim()
    splitKeys.push _lastSplitKey().trim()
    splitKeys

  createSplitName = (key, ratio) ->
    key + '_' + format4f ratio
  
  updateSplitRatiosAndNames = ->
    totalRatio = 0
    for ratio in collectRatios()
      totalRatio += ratio
    lastSplitRatio = 
    _lastSplitRatio 1 - totalRatio

    frameKey = if frame = _frame() then frame else 'frame'
    for entry in _splits()
      entry.key createSplitName frameKey, entry.ratio()

    _lastSplitKey createSplitName frameKey, _lastSplitRatio()

    return

  computeSplits = (go) ->
    return go 'Frame not specified.' if not _frame()

    splitRatios = collectRatios()

    totalRatio = 0
    for ratio in splitRatios
      if 0 < ratio < 1
        totalRatio += ratio
      else
        return go 'One or more split ratios are invalid. Ratios should between 0 and 1.'

    return go 'Sum of ratios is >= 1.' if totalRatio >= 1

    splitKeys = collectKeys()
    for key in splitKeys
      return go 'One or more keys are empty or invalid.' if key is ''

    return go 'Please specify at least two splits.' if splitKeys.length < 2

    return go 'Duplicate keys specified.' if splitKeys.length isnt (uniq splitKeys).length

    return go null, splitRatios, splitKeys

  createSplit = (ratio) ->
    _ratioText = signal '' + ratio
    _key = signal ''
    _ratio = lift _ratioText, (text) -> parseFloat text
    react _ratioText, updateSplitRatiosAndNames

    remove = ->
      _splits.remove self

    self =
      key: _key
      ratioText: _ratioText
      ratio: _ratio
      remove: remove

  addSplitRatio = (ratio) ->
    _splits.push createSplit ratio

  addSplit = ->
    addSplitRatio 0

  splitFrame = ->
    computeSplits (error, splitRatios, splitKeys) ->
      if error
        _validationMessage error
      else
        _validationMessage ''
        _.insertAndExecuteCell 'cs', "splitFrame #{stringify _frame()}, #{stringify splitRatios}, #{stringify splitKeys}, #{_seed()}"

  initialize = ->
    _.requestFrames (error, frames) ->
      if error
        #TODO handle properly
      else
        frameKeys = (frame.frame_id.name for frame in frames when not frame.is_text)
        frameKeys = sortBy frameKeys
        _frames frameKeys
        _frame _frameKey
    addSplitRatio 0.75
    defer _go

  initialize()

  frames: _frames
  frame: _frame
  lastSplitRatio: _lastSplitRatio
  lastSplitRatioText: _lastSplitRatioText
  lastSplitKey: _lastSplitKey
  splits: _splits
  seed: _seed
  addSplit: addSplit
  splitFrame: splitFrame
  validationMessage: _validationMessage
  template: 'flow-split-frame-input'


