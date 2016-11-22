H2O.PartialDependenceInput = (_, _go) ->
  _exception = signal null #TODO display in .jade
  _destinationKey = signal "ppd-#{Flow.Util.uuid()}"

  _frames = signals []
  _models = signals []
  _selectedModel = signals null
  _selectedFrame = signal null
  _nbins = signal 20

  # _leftColumns = signals []
  # _selectedLeftColumn = signal null
  # _includeAllLeftRows = signal false

  # _selectedRightFrame = signal null
  # _rightColumns = signals []
  # _selectedRightColumn = signal null
  # _includeAllRightRows = signal false

  # a conditional check that makes sure that 
  # all fields in the form are filled in
  # before the button is shown as active
  _canCompute = lift _destinationKey, _selectedFrame, _selectedModel, _nbins, (dk, sf, sm, nb) ->
    dk and sf and sm and nb

  # react _selectedFrame, (frameKey) ->
  #   if frameKey
  #     _.requestFrameSummaryWithoutData frameKey, (error, frame) ->
  #       _leftColumns map frame.columns, (column, i) -> 
  #         label: column.label
  #         index: i
  #   else
  #     _selectedLeftColumn null
  #     _leftColumns []

  # react _selectedRightFrame, (frameKey) ->
  #   if frameKey
  #     _.requestFrameSummaryWithoutData frameKey, (error, frame) ->
  #       _rightColumns map frame.columns, (column, i) -> 
  #         label: column.label
  #         index: i
  #   else
  #     _selectedRightColumn null
  #     _rightColumns []

  _compute = ->
    return unless _canCompute()

    # parameters are selections from Flow UI
    # form dropdown menus, text boxes, etc
    opts =
      destination_key: _destinationKey()
      model_id: _selectedModel()
      frame_id: _selectedFrame()
      nbins: _nbins()

    # assemble a string for the h2o Rapids AST
    # this contains the function to call
    # along with the options to pass in
    cs = "buildPartialDependence #{stringify opts}"

    # insert a cell with the expression `cs` 
    # into the current Flow notebook
    # and run the cell
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
  # leftColumns: _leftColumns
  # selectedLeftColumn: _selectedLeftColumn
  # includeAllLeftRows: _includeAllLeftRows
  # selectedRightFrame: _selectedRightFrame
  # rightColumns: _rightColumns
  # selectedRightColumn: _selectedRightColumn
  # includeAllRightRows: _includeAllRightRows
  compute: _compute
  canCompute: _canCompute

  template: 'flow-partial-dependence-input'


