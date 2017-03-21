H2O.MergeFramesInput = (_, _go) ->
  _exception = signal null #TODO display in .jade
  _destinationKey = signal "merged-#{Flow.Util.uuid()}"

  _frames = signals []
  _selectedLeftFrame = signal null
  _leftColumns = signals []
  _selectedLeftColumn = signal null
  _includeAllLeftRows = signal false

  _selectedRightFrame = signal null
  _rightColumns = signals []
  _selectedRightColumn = signal null
  _includeAllRightRows = signal false

  _canMerge = lift _selectedLeftFrame, _selectedLeftColumn, _selectedRightFrame, _selectedRightColumn, (lf, lc, rf, rc) ->
    lf and lc and rf and rc

  react _selectedLeftFrame, (frameKey) ->
    if frameKey
      _.requestFrameSummaryWithoutData frameKey, (error, frame) ->
        _leftColumns map frame.columns, (column, i) -> 
          label: column.label
          index: i
    else
      _selectedLeftColumn null
      _leftColumns []

  react _selectedRightFrame, (frameKey) ->
    if frameKey
      _.requestFrameSummaryWithoutData frameKey, (error, frame) ->
        _rightColumns map frame.columns, (column, i) -> 
          label: column.label
          index: i
    else
      _selectedRightColumn null
      _rightColumns []

  _merge = ->
    return unless _canMerge()

    cs = "mergeFrames #{stringify _destinationKey()}, #{stringify _selectedLeftFrame()}, #{_selectedLeftColumn().index}, #{_includeAllLeftRows()}, #{stringify _selectedRightFrame()}, #{_selectedRightColumn().index}, #{_includeAllRightRows()}"

    _.insertAndExecuteCell 'cs', cs

  _.requestFrames (error, frames) ->
    if error
      _exception new Flow.Error 'Error fetching frame list.', error
    else
      _frames (frame.frame_id.name for frame in frames when not frame.is_text)

  defer _go

  destinationKey: _destinationKey
  frames: _frames
  selectedLeftFrame: _selectedLeftFrame
  leftColumns: _leftColumns
  selectedLeftColumn: _selectedLeftColumn
  includeAllLeftRows: _includeAllLeftRows
  selectedRightFrame: _selectedRightFrame
  rightColumns: _rightColumns
  selectedRightColumn: _selectedRightColumn
  includeAllRightRows: _includeAllRightRows
  merge: _merge
  canMerge: _canMerge
  template: 'flow-merge-frames-input'


