H2O.ModelDeviancesVisInput = (_, _go, _models) ->
  _exception = signal null #TODO display in .jade
  _destinationKey = signal "ppd-#{Flow.Util.uuid()}"
  _frames = signals []
  _models = signals []
  _selectedModel = signals null
  _selectedFrame = signal null
  _nbins = signal 20
  _modelViews = signal []
  _checkAllModels = signal no
  _checkedModelCount = signal 0
  _canCompareModels = lift _checkedModelCount, (count) -> count > 1
  _hasSelectedModels = lift _checkedModelCount, (count) -> count > 0

  _isCheckingAll = no
  react _checkAllModels, (checkAll) ->
    _isCheckingAll = yes
    views = _modelViews()
    for view in views
      view.isChecked checkAll
    _checkedModelCount if checkAll then views.length else 0
    _isCheckingAll = no
    return

  # _leftColumns = signals []
  # _selectedLeftColumn = signal null
  # _includeAllLeftRows = signal false

  # _selectedRightFrame = signal null
  # _rightColumns = signals []
  # _selectedRightColumn = signal null
  # _includeAllRightRows = signal false

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

    opts =
      destination_key: _destinationKey()
      model_id: _selectedModel()
      frame_id: _selectedFrame()
      nbins: _nbins()

    cs = "buildModelDeviancesVis #{stringify opts}"

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

  createModelView = (model) ->
    _isChecked = signal no

    react _isChecked, ->
      return if _isCheckingAll
      checkedViews = (view for view in _modelViews() when view.isChecked())
      _checkedModelCount checkedViews.length

    predict = ->
      _.insertAndExecuteCell 'cs', "predict model: #{stringify model.model_id.name}"

    cloneModel = ->
      return alert 'Not implemented'
      _.insertAndExecuteCell 'cs', "cloneModel #{stringify model.model_id.name}"

    view = ->
      _.insertAndExecuteCell 'cs', "getModel #{stringify model.model_id.name}"

    inspect = ->
      _.insertAndExecuteCell 'cs', "inspect getModel #{stringify model.model_id.name}"

    key: model.model_id.name
    algo: model.algo_full_name
    isChecked: _isChecked
    predict: predict
    clone: cloneModel
    inspect: inspect
    view: view

  buildModel = ->
    _.insertAndExecuteCell 'cs', 'buildModel'

  collectSelectedKeys = ->
    for view in _modelViews() when view.isChecked()
      view.key 

  compareModels = ->
    _.insertAndExecuteCell 'cs', "inspect getModels #{stringify collectSelectedKeys()}"

  predictUsingModels = ->
    _.insertAndExecuteCell 'cs', "predict models: #{stringify collectSelectedKeys()}"

  deleteModels = ->
    _.confirm 'Are you sure you want to delete these models?', { acceptCaption: 'Delete Models', declineCaption: 'Cancel' }, (accept) ->
      if accept
        _.insertAndExecuteCell 'cs', "deleteModels #{stringify collectSelectedKeys()}"

  inspectAll = ->
    allKeys = (view.key for view in _modelViews())
    #TODO use table origin
    _.insertAndExecuteCell 'cs', "inspect getModels #{stringify allKeys}"

  initialize = (models) ->
    _modelViews map models, createModelView
    defer _go

  initialize _models

  console.log '_modelViews', _modelViews

  destinationKey: _destinationKey
  frames: _frames
  models: _models
  hasModels: _models.length > 0
  selectedModel: _selectedModel
  selectedFrame: _selectedFrame
  nbins: _nbins
  compute: _compute
  canCompute: _canCompute
  modelViews: _modelViews
  checkAllModels: _checkAllModels
  template: 'flow-partial-dependence-input'
  # leftColumns: _leftColumns
  # selectedLeftColumn: _selectedLeftColumn
  # includeAllLeftRows: _includeAllLeftRows
  # selectedRightFrame: _selectedRightFrame
  # rightColumns: _rightColumns
  # selectedRightColumn: _selectedRightColumn
  # includeAllRightRows: _includeAllRightRows


