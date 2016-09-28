H2O.PartialDependenceInput = (_, _go) ->
  _exception = signal null #TODO display in .jade
  _destinationKey = signal "ppd-#{Flow.Util.uuid()}"

  _frames = signals []
  _models = signals []
  _selectedModel = signals null
  _selectedFrame = signal null
  _nbins = signal null

  _leftColumns = signals []
  _selectedLeftColumn = signal null
  _includeAllLeftRows = signal false

  _selectedRightFrame = signal null
  _rightColumns = signals []
  _selectedRightColumn = signal null
  _includeAllRightRows = signal false

  _canCompute = lift _selectedFrame, _selectedLeftColumn, _selectedRightFrame, _selectedRightColumn, (lf, lc, rf, rc) ->
    lf and lc and rf and rc

  react _selectedFrame, (frameKey) ->
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

  _computer = ->
    return unless _canMerge()

    cs = "mergeFrames #{stringify _destinationKey()}, #{stringify _selectedFrame()}, #{_selectedLeftColumn().index}, #{_includeAllLeftRows()}, #{stringify _selectedRightFrame()}, #{_selectedRightColumn().index}, #{_includeAllRightRows()}"

    _.insertAndExecuteCell 'cs', cs

  _.requestFrames (error, frames) ->
    if error
      _exception new Flow.Error 'Error fetching frame list.', error
    else
      _frames (frame.frame_id.name for frame in frames when not frame.is_text)

  _.requestModels (error, models) ->
    if error
      _exception new Flow.Error 'Error fetching model list.', error
    else
      #TODO use models directly
      _models (model.model_id.name for model in models)

  defer _go

  destinationKey: _destinationKey
  frames: _frames
  models: _models
  selectedModel: _selectedModel
  selectedFrame: _selectedFrame
  nbins: _nbins

  leftColumns: _leftColumns
  selectedLeftColumn: _selectedLeftColumn
  includeAllLeftRows: _includeAllLeftRows
  selectedRightFrame: _selectedRightFrame
  rightColumns: _rightColumns
  selectedRightColumn: _selectedRightColumn
  includeAllRightRows: _includeAllRightRows
  merge: _merge
  canMerge: _canMerge

  template: 'flow-partial-dependence-input'


