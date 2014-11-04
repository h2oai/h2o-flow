createControl = (kind, parameter) ->
  _hasError = signal no
  _hasWarning = signal no
  _hasInfo = signal no
  _message = signal ''
  _hasMessage = lift _message, (message) -> if message then yes else no

  kind: kind
  name: parameter.name
  label: parameter.label
  description: parameter.help
  required: parameter.required
  hasError: _hasError
  hasWarning: _hasWarning
  hasInfo: _hasInfo
  message: _message
  hasMessage: _hasMessage

createTextboxControl = (parameter) ->
  _value = signal parameter.actual_value

  control = createControl 'textbox', parameter
  control.value = _value
  control.defaultValue = parameter.default_value
  control

createDropdownControl = (parameter) ->
  _value = signal parameter.actual_value

  control = createControl 'dropdown', parameter
  control.values = signals parameter.values
  control.value = _value
  control.defaultValue = parameter.default_value
  control

createListControl = (parameter) ->
  _value = signal parameter.actual_value or []
  _selection = lift _value, (items) ->
    caption = "#{Flow.Util.describeCount items.length, 'column'} selected"
    caption += ": #{items.join ', '}" if items.length > 0
    "(#{caption})"

  control = createControl 'list', parameter
  control.values = signals parameter.values
  control.value = _value
  control.selection = _selection
  control.defaultValue = parameter.default_value
  control

createCheckboxControl = (parameter) ->
  _value = signal parameter.actual_value is 'true' #FIXME

  control = createControl 'checkbox', parameter
  control.clientId = do uniqueId
  control.value = _value
  control.defaultValue = parameter.default_value is 'true'
  control

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

H2O.ModelBuilderForm = (_, _algorithm, _parameters) ->
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

  collectParameters = (collectAll=no) ->
    parameters = {}
    for controls in _controls
      for control in controls
        value = control.value()
        if collectAll or (control.defaultValue isnt value)
          switch control.kind
            when 'dropdown'
              if value
                parameters[control.name] = value
            when 'list'
              if value.length
                parameters[control.name] = "[#{value.join ','}]"
            else
              parameters[control.name] = value
    parameters

  createModel = ->
    _exception null
    
#     parameters = collectParameters yes
#     _.requestModelInputValidation _algorithm, parameters, (error, result) ->
#       debug error
#       debug result
#       return
#       if error
#       else
#         _.insertAndExecuteCell 'cs', "buildModel '#{_algorithm}', #{stringify parameters}"
# 
#     return

    parameters = collectParameters no
    _.insertAndExecuteCell 'cs', "buildModel '#{_algorithm}', #{stringify parameters}"

  form: _form
  exception: _exception
  parameterTemplateOf: parameterTemplateOf
  createModel: createModel

H2O.ModelInput = (_, _algo, _opts) ->
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

  do ->
    frameKey = _opts?.training_frame
    act _algorithm, (algorithm) ->
      if algorithm
        _.requestModelBuilders algorithm, (error, result) ->
          if error
            _exception new Flow.Error 'Error fetching model builder', error
          else
            parameters = result.model_builders[algorithm].parameters
            populateFramesAndColumns frameKey, algorithm, parameters, ->
              _modelForm H2O.ModelBuilderForm _, algorithm, parameters
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

