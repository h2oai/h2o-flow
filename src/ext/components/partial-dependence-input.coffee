H2O.PartialDependenceInput = (_, _go) ->
  _exception = signal null #TODO display in .jade
  _destinationKey = signal "ppd-#{Flow.Util.uuid()}"

  _frames = signals []
  _models = signals []
  _selectedModel = signals null
  _selectedFrame = signal null
  _columns = signal []
  _nbins = signal 20
  

  # a conditional check that makes sure that 
  # all fields in the form are filled in
  # before the button is shown as active
  _canCompute = lift _destinationKey, _selectedFrame, _selectedModel, _nbins, (dk, sf, sm, nb) ->
    dk and sf and sm and nb

  _compute = ->
    return unless _canCompute()

    # parameters are selections from Flow UI
    # form dropdown menus, text boxes, etc

    cols = "["
    for col in _columns() when col.isSelected
      cols = cols + "\"" + col.value + "\","
    cols = cols + "]"
    console.log(cols)

    opts =
      destination_key: _destinationKey()
      model_id: _selectedModel()
      frame_id: _selectedFrame()
      cols: cols
      nbins: _nbins()

    cs = "buildPartialDependence #{stringify opts}"

    _.insertAndExecuteCell 'cs', cs

  _updateColumns = ->
      frameKey = _selectedFrame()
      if frameKey
        _.requestFrameSummaryWithoutData frameKey, (error, frame) ->
          unless error
            columnValues = map frame.columns, (column) -> column.label
            columnLabels = map frame.columns, (column) -> 
              missingPercent = 100 * column.missing_count / frame.rows
              isSelected: false
              type: if column.type is 'enum' then "enum(#{column.domain_cardinality})" else column.type
              value: column.label
              missingPercent: missingPercent
              missingLabel: if missingPercent is 0 then '' else "#{round missingPercent}% NA"

            console.log("frame updated:" + _selectedFrame() )
            console.log(columnValues)
            console.log(columnLabels)

            _columns columnLabels

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
  columns: _columns
  nbins: _nbins
  compute: _compute
  updateColumns: _updateColumns
  canCompute: _canCompute

  template: 'flow-partial-dependence-input'


