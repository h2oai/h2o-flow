createControl = (kind, parameter) ->
  _hasError = signal no
  _hasWarning = signal no
  _hasInfo = signal no
  _message = signal ''
  _hasMessage = lift _message, (message) -> if message then yes else no
  _isVisible = signal yes

  kind: kind
  name: parameter.name
  label: parameter.label
  description: parameter.help
  isRequired: parameter.required
  hasError: _hasError
  hasWarning: _hasWarning
  hasInfo: _hasInfo
  message: _message
  hasMessage: _hasMessage
  isVisible: _isVisible

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

createListControl__old = (parameter) ->
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

createListControl = (parameter) ->
  _searchTerm = signal ''

  createValueView = (value) ->
    _isVisible = signal yes
    _isAvailable = signal yes

    include = ->
      self.isAvailable no
      _selectedValues.push self

    exclude = ->
      self.isAvailable yes
      _selectedValues.remove self

    self =
      value: value
      include: include
      exclude: exclude
      isVisible: _isVisible
      isAvailable: _isAvailable

  _values = signals parameter.values
  _availableValues = lift _values, (vals) -> map vals, createValueView
  _views = {}
  for view in _availableValues()
    _views[view.value] = view

  _selectedValues = signals map parameter.actual_value, (selectedValue) ->
    view = _views[selectedValue]
    view.isAvailable no
    view

  _value = lift _selectedValues, (views) ->
    for view in views
      view.value

  includeAll = ->
    for view in _availableValues() when view.isVisible()
      view.include()
    return

  excludeAll = ->
    selectedValues = copy _selectedValues()
    for view in selectedValues
      view.exclude()
    return
  
  _search = ->
    for view in _availableValues()
      term = _searchTerm().trim()
      view.isVisible term is '' or 0 <= view.value.toLowerCase().indexOf term.toLowerCase()
    return

  react _searchTerm, throttle _search, 500

  control = createControl 'list', parameter
  control.values = _values
  control.availableValues = _availableValues
  control.selectedValues = _selectedValues
  control.value = _value
  control.searchTerm = _searchTerm
  control.defaultValue = parameter.default_value
  control.includeAll = includeAll
  control.excludeAll = excludeAll
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
    when 'Key', 'byte', 'short', 'int', 'long', 'float', 'double', 'byte[]', 'short[]', 'int[]', 'long[]', 'float[]', 'double[]'
      createTextboxControl parameter
    else
      console.error 'Invalid field', JSON.stringify parameter, null, 2
      null

findParameter = (parameters, name) ->
  find parameters, (parameter) -> parameter.name is name

H2O.ModelBuilderForm = (_, _algorithm, _parameters) ->
  _exception = signal null

  _parametersByLevel = groupBy _parameters, (parameter) -> parameter.level
  _controlGroups = map [ 'critical', 'secondary', 'expert' ], (type) ->
    filter (map _parametersByLevel[type], createControlFromParameter), (a) -> if a then yes else no

  [ criticalControls, secondaryControls, expertControls ] = _controlGroups

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

  findControl = (name) ->
    for controls in _controlGroups
      for control in controls when control.name is name
        return control
    return

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

  collectParameters = (includeUnchangedParameters=no) ->
    parameters = {}
    for controls in _controlGroups
      for control in controls
        value = control.value()
        if includeUnchangedParameters or (control.defaultValue isnt value)
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

  performValidations = (checkForErrors, go) ->
    _exception null
    parameters = collectParameters yes
    _.requestModelInputValidation _algorithm, parameters, (error, modelBuilder) ->
      if error
        _exception Flow.Failure new Flow.Error 'Error fetching initial model builder state', error
      else
        hasErrors = no
        for validation in modelBuilder.validation_messages
          control = findControl validation.field_name
          if control
            if validation.message_type is 'HIDE'
              control.isVisible no
            else if not checkForErrors
              switch validation.message_type
                when 'INFO'
                  control.isVisible yes
                  control.message validation.message
                when 'WARN'
                  control.isVisible yes
                  control.message validation.message
                when 'ERROR'
                  control.isVisible yes
                  control.hasError yes
                  control.message validation.message
                  hasErrors = yes
        go() unless hasErrors

  createModel = ->
    _exception null
    performValidations no, ->
      parameters = collectParameters no
      _.insertAndExecuteCell 'cs', "buildModel '#{_algorithm}', #{stringify parameters}"

  # Kick off validations (minus error checking) to get hidden parameters
  performValidations yes, ->

  form: _form
  exception: _exception
  parameterTemplateOf: parameterTemplateOf
  createModel: createModel

H2O.ModelInput = (_, _algo, _opts) ->
  _exception = signal null
  _algorithms = signal []
  _algorithm = signal _algo
  _canCreateModel = lift _algorithm, (algorithm) -> if algorithm then yes else no

  _modelForm = signal null

  populateFramesAndColumns = (frameKey, algorithm, parameters, go) ->

    #
    # Force classification.
    #
    classificationParameter = findParameter parameters, 'do_classification'
    if classificationParameter
      classificationParameter.actual_value = classificationParameter.default_value = "true"

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
    _.requestModelBuilders (error, result) ->
      modelBuilders = if error then [] else result.model_builders
      _algorithms (key for key in keys modelBuilders when key isnt 'example')
      frameKey = _opts?.training_frame
      act _algorithm, (algorithm) ->
        if algorithm
          _.requestModelBuilder algorithm, (error, result) ->
            if error
              _exception Flow.Failure new Flow.Error 'Error fetching model builder', error
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

