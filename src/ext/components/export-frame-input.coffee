{ defer } = require('lodash')

{ stringify } = require('../../core/modules/prelude')
{ react, lift, link, signal, signals } = require("../../core/modules/dataflow")

module.exports = (_, _go, frameKey, path, opt) ->
  _frames = signal []
  _selectedFrame = signal frameKey 
  _path = signal null 
  _overwrite = signal yes
  _canExportFrame = lift _selectedFrame, _path, (frame, path) -> frame and path

  exportFrame = ->
    _.insertAndExecuteCell 'cs', "exportFrame #{stringify _selectedFrame()}, #{stringify _path()}, overwrite: #{if _overwrite() then 'true' else 'false'}"

  _.requestFrames (error, frames) ->
    if error
      #TODO handle properly
    else
      _frames (frame.frame_id.name for frame in frames)
      _selectedFrame frameKey

  defer _go

  frames: _frames
  selectedFrame: _selectedFrame
  path: _path
  overwrite: _overwrite
  canExportFrame: _canExportFrame
  exportFrame: exportFrame
  template: 'flow-export-frame-input'

