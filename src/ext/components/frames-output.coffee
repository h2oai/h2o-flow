{ defer, map } = require('lodash')

{ stringify } = require('../../core/modules/prelude')
{ react, lift, link, signal, signals } = require("../../core/modules/dataflow")
util = require('../../core/modules/util')

module.exports = (_, _go, _frames) ->
  _frameViews = signal []
  _checkAllFrames = signal no
  _hasSelectedFrames = signal no

  _isCheckingAll = no
  react _checkAllFrames, (checkAll) ->
    _isCheckingAll = yes
    for view in _frameViews()
      view.isChecked checkAll
    _hasSelectedFrames checkAll
    _isCheckingAll = no
    return

  createFrameView = (frame) ->
    _isChecked = signal no

    react _isChecked, ->
      return if _isCheckingAll
      checkedViews = (view for view in _frameViews() when view.isChecked())
      _hasSelectedFrames checkedViews.length > 0

    view = ->
      if frame.is_text
        _.insertAndExecuteCell 'cs', "setupParse source_frames: [ #{stringify frame.frame_id.name } ]"
      else
        _.insertAndExecuteCell 'cs', "getFrameSummary #{stringify frame.frame_id.name}"

    predict = ->
      _.insertAndExecuteCell 'cs', "predict frame: #{stringify frame.frame_id.name}"

    inspect = ->
      _.insertAndExecuteCell 'cs', "inspect getFrameSummary #{stringify frame.frame_id.name}"

    createModel = ->
      _.insertAndExecuteCell 'cs', "assist buildModel, null, training_frame: #{stringify frame.frame_id.name}"

    createAutoML = ->
      _.insertAndExecuteCell 'cs', "assist runAutoML, training_frame: #{stringify frame.frame_id.name}"


    key: frame.frame_id.name
    isChecked: _isChecked
    size: util.formatBytes frame.byte_size
    rowCount: frame.rows
    columnCount: frame.columns
    isText: frame.is_text
    view: view
    predict: predict
    inspect: inspect
    createModel: createModel
    createAutoML: createAutoML

  importFiles = ->
    _.insertAndExecuteCell 'cs', 'importFiles'

  collectSelectedKeys = ->
    for view in _frameViews() when view.isChecked()
      view.key

  predictOnFrames = ->
    _.insertAndExecuteCell 'cs', "predict frames: #{stringify collectSelectedKeys()}"

  deleteFrames = ->
    _.confirm 'Are you sure you want to delete these frames?', { acceptCaption: 'Delete Frames', declineCaption: 'Cancel' }, (accept) ->
      if accept
        _.insertAndExecuteCell 'cs', "deleteFrames #{stringify collectSelectedKeys()}"
    


  _frameViews map _frames, createFrameView

  defer _go

  frameViews: _frameViews
  hasFrames: _frames.length > 0
  importFiles: importFiles
  predictOnFrames: predictOnFrames
  deleteFrames: deleteFrames
  hasSelectedFrames: _hasSelectedFrames
  checkAllFrames: _checkAllFrames
  template: 'flow-frames-output'

