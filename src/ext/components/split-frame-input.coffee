H2O.SplitFrameInput = (_, frameKey) ->
  _frames = signal []
  _frame = signal null
  _lastSplitRatio = signal 1
  _lastSplitRatioText = lift _lastSplitRatio, (ratio) -> ratio #TODO format?
  _lastSplitKey = signal ''
  _splits = signals []
  _validationMessage = signal ''

  collectRatios = ->
    for entry in _splits()
      entry.ratio()

  collectKeys = ->
    splitKeys = for entry in _splits()
      entry.key().trim()
    splitKeys.push _lastSplitKey().trim()
    splitKeys

  updateLastSplit = ->
    totalRatio = 0
    for ratio in collectRatios()
      totalRatio += ratio
    _lastSplitRatio 1 - totalRatio

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

    return go 'Pleas specify at least two splits.' if splitKeys.length < 2

    return go 'Duplicate keys specified.' if splitKeys.length isnt (unique splitKeys).length

    return go null, splitRatios, splitKeys

  createSplit = ->
    _ratioText = signal '0'
    _key = signal ''
    _ratio = lift _ratioText, (text) -> parseFloat text
    react _ratioText, updateLastSplit

    remove = ->
      _splits.remove self

    self =
      key: _key
      ratioText: _ratioText
      ratio: _ratio
      remove: remove

  addSplit = ->
    _splits.push createSplit()

  splitFrame = ->
    computeSplits (error, splitRatios, splitKeys) ->
      if error
        _validationMessage error
      else
        _validationMessage ''
        _.insertAndExecuteCell 'cs', "splitFrame #{stringify _frame()}, #{stringify splitRatios}, #{stringify splitKeys}"

  initialize = ->
    _.requestFrames (error, frames) ->
      if error
        #TODO handle properly
      else
        frameKeys = (frame.key.name for frame in frames)
        sort frameKeys
        _frames frameKeys
    addSplit()

  initialize()

  frames: _frames
  frame: _frame
  lastSplitRatio: _lastSplitRatio
  lastSplitRatioText: _lastSplitRatioText
  lastSplitKey: _lastSplitKey
  splits: _splits
  addSplit: addSplit
  splitFrame: splitFrame
  validationMessage: _validationMessage
  template: 'flow-split-frame-input'


