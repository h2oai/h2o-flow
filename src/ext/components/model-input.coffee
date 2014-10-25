createTextboxControl = (parameter) ->
  value = signal parameter.actual_value

  kind: 'textbox'
  name: parameter.name
  label: parameter.label
  description: parameter.help
  required: parameter.required
  value: value
  defaultValue: parameter.default_value
  help: signal 'Help goes here.'
  isInvalid: signal no

createDropdownControl = (parameter) ->
  value = signal parameter.actual_value

  kind: 'dropdown'
  name: parameter.name
  label: parameter.label
  description: parameter.help
  required: parameter.required
  values: signals parameter.values
  value: value
  defaultValue: parameter.default_value
  help: signal 'Help goes here.'
  isInvalid: signal no

createListControl = (parameter) ->
  value = signal parameter.actual_value or []
  selection = lift value, (items) ->
    caption = "#{Flow.Util.describeCount items.length, 'column'} selected"
    caption += ": #{items.join ', '}" if items.length > 0
    "(#{caption})"

  kind: 'list'
  name: parameter.name
  label: parameter.label
  description: parameter.help
  required: parameter.required
  values: signals parameter.values
  value: value
  selection: selection
  defaultValue: parameter.default_value
  help: signal 'Help goes here.'
  isInvalid: signal no

createCheckboxControl = (parameter) ->
  value = signal parameter.actual_value is 'true' #FIXME

  clientId: do uniqueId
  kind: 'checkbox'
  name: parameter.name
  label: parameter.label
  description: parameter.help
  required: parameter.required
  value: value
  defaultValue: parameter.default_value is 'true'
  help: signal 'Help goes here.'
  isInvalid: signal no

createControlFromParameter = (parameter) ->
  switch parameter.type
    when 'enum', 'Frame', 'string'
      createDropdownControl parameter
    when 'string[]'
      createListControl parameter
    when 'boolean'
      createCheckboxControl parameter
    when 'Key', 'byte', 'short', 'int', 'long', 'float', 'double', 'int[]', 'long[]', 'float[]', 'double[]'
      createTextboxControl parameter
    else
      console.error 'Invalid field', JSON.stringify parameter, null, 2
      null

findParameter = (parameters, name) ->
  find parameters, (parameter) -> parameter.name is name

Flow.ModelBuilderForm = (_, _algorithm, _parameters) ->
  _exception = signal null

  _parametersByLevel = groupBy _parameters, (parameter) -> parameter.level
  _controls = map [ 'critical', 'secondary', 'expert' ], (type) ->
    filter (map _parametersByLevel[type], createControlFromParameter), (a) -> if a then yes else no

  [ criticalControls, secondaryControls, expertControls ] = _controls

  _form = flatten [ 
    kind: 'group'
    title: 'Parameters'
  ,
    criticalControls
  ,
    kind: 'group'
    title: 'Advanced'
  ,
    secondaryControls
  ,
    kind: 'group'
    title: 'Expert'
  ,
    expertControls
  ]

  parameterTemplateOf = (control) -> "flow-#{control.kind}-model-parameter"

  do ->
    findFormField = (name) -> find _form, (field) -> field.name is name
    [ trainingFrameParameter, validationFrameParameter, responseColumnParameter, ignoredColumnsParameter ] = map [ 'training_frame', 'validation_frame', 'response_column', 'ignored_columns' ], findFormField

    if trainingFrameParameter
      if responseColumnParameter or ignoredColumnsParameter
        act trainingFrameParameter.value, (frameKey) ->
          if frameKey
            _.requestFrame frameKey, (error, frame) ->
              unless error
                columnLabels = map frame.columns, (column) -> column.label
                if responseColumnParameter
                  responseColumnParameter.values columnLabels
                if ignoredColumnsParameter
                  ignoredColumnsParameter.values columnLabels
          return

  createModel = ->
    _exception null
    parameters = {}
    for controls in _controls
      for control in controls
        if control.defaultValue isnt value = control.value()
          switch control.kind
            when 'dropdown'
              if value
                parameters[control.name] = value
            when 'list'
              if value.length
                parameters[control.name] = "[#{value.join ','}]"
            else
              parameters[control.name] = value
    
    _.insertAndExecuteCell 'cs', "buildModel '#{_algorithm}', #{stringify parameters}"
    return
    _.requestModelBuild _algorithm, parameters, (error, result) ->
      if error
        _exception Flow.Exception error.data.errmsg, error

  form: _form
  exception: _exception
  parameterTemplateOf: parameterTemplateOf
  createModel: createModel

Flow.ModelInput = (_, _algo, _opts) ->
  _exception = signal null
  _algorithms = [ 'kmeans', 'deeplearning', 'glm', 'gbm' ]
  _algorithm = signal _algo
  _canCreateModel = lift _algorithm, (algorithm) -> if algorithm then yes else no

  _modelForm = signal null

  populateFramesAndColumns = (frameKey, algorithm, parameters, go) ->
    # Fetch frame list; pick column names from training frame
    _.requestFrames (error, frames) ->
      if error
        #TODO handle properly
      else
        trainingFrameParameter = findParameter parameters, 'training_frame'
        if trainingFrameParameter

          # Show only parsed frames
          trainingFrameParameter.values = (frame.key.name for frame in frames when not frame.isText)

          if frameKey
            trainingFrameParameter.actual_value = frameKey
          else
            frameKey = trainingFrameParameter.actual_value

        return go()

  # If a source model is specified, we already know the algo, so skip algo selection
#     if _sourceModel
#       parameters = _sourceModel.parameters
#       trainingFrameParameter = findParameter parameters, 'training_frame'
# 
#       #TODO INSANE SUPERHACK
#       hasRateAnnealing = find _sourceModel.parameters, (parameter) -> parameter.name is 'rate_annealing'
#       algorithm = if hasRateAnnealing
#           find algorithms, (algorithm) -> algorithm is 'deeplearning'
#         else
#           find algorithms, (algorithm) -> algorithm is 'kmeans'
# 
#       populateFramesAndColumns _frameKey, algorithm, parameters, ->
#         _modelForm Flow.ModelBuilderForm _, algorithm, parameters
# 
#     else

  do ->
    frameKey = _opts?.training_frame
    act _algorithm, (algorithm) ->
      if algorithm
        _.requestModelBuilders algorithm, (error, result) ->
          if error
            _exception Flow.Exception 'Error fetching model builder', error
          else
            parameters = result.model_builders[algorithm].parameters
            populateFramesAndColumns frameKey, algorithm, parameters, ->
              _modelForm Flow.ModelBuilderForm _, algorithm, parameters
      else
        _modelForm null

  createModel = -> _modelForm().createModel()

  parentException: _exception #XXX hacky
  algorithms: _algorithms
  algorithm: _algorithm
  modelForm: _modelForm
  canCreateModel: _canCreateModel
  createModel: createModel
  template: 'flow-model-input'

