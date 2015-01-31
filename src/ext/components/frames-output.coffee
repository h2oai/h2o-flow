H2O.FramesOutput = (_, _frames) ->
  _frameViews = signal []
  _checkAllFrames = signal no
  _canCompareFrames = signal no

  _isCheckingAll = no
  react _checkAllFrames, (checkAll) ->
    _isCheckingAll = yes
    for view in _frameViews()
      view.isChecked checkAll
    _canCompareFrames checkAll
    _isCheckingAll = no
    return

  createFrameView = (frame) ->
    _isChecked = signal no

    react _isChecked, ->
      return if _isCheckingAll
      checkedViews = (view for view in _frameViews() when view.isChecked())
      _canCompareFrames checkedViews.length > 0

    columnLabels = head (map frame.columns, (column) -> column.label), 15
    description = 'Columns: ' + (columnLabels.join ', ') + if frame.columns.length > columnLabels.length then "... (#{frame.columns.length - columnLabels.length} more columns)" else ''

    view = ->
      if frame.isText
        _.insertAndExecuteCell 'cs', "setupParse [ #{stringify frame.key.name } ]"
      else
        _.insertAndExecuteCell 'cs', "getFrame #{stringify frame.key.name}"

    predict = ->
      _.insertAndExecuteCell 'cs', "predict null, #{stringify frame.key.name}"

    inspect = ->
      _.insertAndExecuteCell 'cs', "inspect getFrame #{stringify frame.key.name}"

    createModel = ->
      _.insertAndExecuteCell 'cs', "assist buildModel, null, training_frame: #{stringify frame.key.name}"

    key: frame.key.name
    isChecked: _isChecked
    description: description
    size: Flow.Util.formatBytes frame.byteSize
    rowCount: frame.rows
    columnCount: frame.columns.length
    isText: frame.isText
    view: view
    predict: predict
    inspect: inspect
    createModel: createModel

  importFiles = ->
    _.insertAndExecuteCell 'cs', 'importFiles'

  predictOnFrames = ->
    selectedKeys = (view.key for view in _frameViews() when view.isChecked())
    _.insertAndExecuteCell 'cs', "predict null, #{stringify selectedKeys}"

  _frameViews map _frames, createFrameView

  frameViews: _frameViews
  hasFrames: _frames.length > 0
  importFiles: importFiles
  predictOnFrames: predictOnFrames
  canCompareFrames: _canCompareFrames
  checkAllFrames: _checkAllFrames
  template: 'flow-frames-output'

