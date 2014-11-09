H2O.ModelOutput = (_, _model) ->
  _isExpanded = signal no
  
  _inputParameters = map _model.parameters, (parameter) ->
    label: parameter.label
    value: parameter.actual_value
    help: parameter.help
    isModified: parameter.default_value is parameter.actual_value

  toggle = ->
    _isExpanded not _isExpanded()

  cloneModel = ->
    # _.insertAndExecuteCell 'cs', 'assist buildModel, 
    alert 'Not implemented'

  predict = ->
    _.insertAndExecuteCell 'cs', "predict #{stringify _model.key}"

  inspect = ->
    _.insertAndExecuteCell 'cs', "inspect getModel #{stringify _model.key}"

  key: _model.key
  inputParameters: _inputParameters
  isExpanded: _isExpanded
  toggle: toggle
  cloneModel: cloneModel
  predict: predict
  template: 'flow-model-output'

