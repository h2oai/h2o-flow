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

createTextboxControl = (parameter, type) ->
  isArrayValued = isInt = isReal = no

  switch type
    when 'byte[]', 'short[]', 'int[]', 'long[]'
      isArrayValued = yes
      isInt = yes
    when 'float[]', 'double[]'
      isArrayValued = yes
      isReal = yes
    when 'byte', 'short', 'int', 'long'
      isInt = yes
    when 'float', 'double'
      isReal = yes
  
  _text = signal if isArrayValued then join (parameter.actual_value ? []), ', ' else (parameter.actual_value ? '')

  _value = lift _text, (text) ->
    if isArrayValued
      vals = []
      for value in split text, /\s*,\s*/g
        if isInt
          unless isNaN parsed = parseInt value, 10
            vals.push parsed
        else if isReal
          unless isNaN parsed = parseFloat value
            vals.push parsed
        else
          vals.push value
      vals
    else
      text

  control = createControl 'textbox', parameter
  control.text = _text
  control.value = _value
  control.isArrayValued = isArrayValued

  control

createDropdownControl = (parameter) ->
  _value = signal parameter.actual_value

  control = createControl 'dropdown', parameter
  control.values = signals parameter.values
  control.value = _value
  control

createListControl = (parameter) ->
  _availableSearchTerm = signal ''
  _selectedSearchTerm = signal ''

  createValueView = ({ label, value }) ->
    _isAvailable = signal yes
    _canInclude = signal yes
    _canExclude = signal yes

    include = ->
      self.isAvailable no
      _selectedValues.push self

    exclude = ->
      self.isAvailable yes
      _selectedValues.remove self

    self =
      label: label
      value: value
      include: include
      exclude: exclude
      canInclude: _canInclude
      canExclude: _canExclude
      isAvailable: _isAvailable

  _values = signals map parameter.values, (value) ->
    label: value
    value: value

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

  _availableValuesCaption = signal "0 items hidden"
  _selectedValuesCaption = signal "0 items hidden"

  includeAll = ->
    for view in _availableValues() when view.canInclude() and view.isAvailable()
      view.include()
    return

  excludeAll = ->
    selectedValues = copy _selectedValues()
    for view in selectedValues
      view.exclude()
    return
  
  _searchAvailable = ->
    hiddenCount = 0
    for view in _availableValues()
      term = _availableSearchTerm().trim()
      if term is '' or 0 <= view.value.toLowerCase().indexOf term.toLowerCase()
        view.canInclude yes
      else
        view.canInclude no
        hiddenCount++
    _availableValuesCaption "#{hiddenCount} items hidden"
    return

  _searchSelected = ->
    hiddenCount = 0
    for view in _availableValues()
      term = _selectedSearchTerm().trim()
      if term is '' or 0 <= view.value.toLowerCase().indexOf term.toLowerCase()
        view.canExclude yes
      else
        view.canExclude no
        hiddenCount++ if not view.isAvailable()
    _selectedValuesCaption "#{hiddenCount} items hidden"
    return

  react _availableSearchTerm, throttle _searchAvailable, 500
  react _selectedSearchTerm, throttle _searchSelected, 500
  react _selectedValues, throttle _searchSelected, 500

  control = createControl 'list', parameter
  control.values = _values
  control.availableValues = _availableValues
  control.selectedValues = _selectedValues
  control.value = _value
  control.availableSearchTerm = _availableSearchTerm
  control.selectedSearchTerm = _selectedSearchTerm
  control.availableValuesCaption = _availableValuesCaption
  control.selectedValuesCaption = _selectedValuesCaption
  control.includeAll = includeAll
  control.excludeAll = excludeAll
  control

createCheckboxControl = (parameter) ->
  _value = signal parameter.actual_value

  control = createControl 'checkbox', parameter
  control.clientId = do uniqueId
  control.value = _value
  control

createControlFromParameter = (parameter) ->
  switch parameter.type
    when 'enum', 'Key<Frame>', 'VecSpecifier'
      createDropdownControl parameter
    when 'string[]'
      createListControl parameter
    when 'boolean'
      createCheckboxControl parameter
    when 'Key<Model>', 'byte', 'short', 'int', 'long', 'float', 'double', 'byte[]', 'short[]', 'int[]', 'long[]', 'float[]', 'double[]'
      createTextboxControl parameter, parameter.type
    else
      console.error 'Invalid field', JSON.stringify parameter, null, 2
      null

H2O.ModelBuilderForm = (_, _algorithm, _parameters) ->
  _exception = signal null
  _validationFailureMessage = signal ''
  _hasValidationFailures = lift _validationFailureMessage, isTruthy

  _parametersByLevel = groupBy _parameters, (parameter) -> parameter.level
  _controlGroups = map [ 'critical', 'secondary', 'expert' ], (type) ->
    filter (map _parametersByLevel[type], createControlFromParameter), (a) -> if a then yes else no

  [ criticalControls, secondaryControls, expertControls ] = _controlGroups

  _form = []
  if criticalControls.length
    _form.push kind: 'group', title: 'Parameters'
    _form.push control for control in criticalControls

  if secondaryControls.length
    _form.push kind: 'group', title: 'Advanced'
    _form.push control for control in secondaryControls

  if expertControls.length
    _form.push kind: 'group', title: 'Expert'
    _form.push control for control in expertControls

  findControl = (name) ->
    for controls in _controlGroups
      for control in controls when control.name is name
        return control
    return

  parameterTemplateOf = (control) -> "flow-#{control.kind}-model-parameter"

  findFormField = (name) -> find _form, (field) -> field.name is name

  do ->
    [ trainingFrameParameter, validationFrameParameter, responseColumnParameter, ignoredColumnsParameter ] = map [ 'training_frame', 'validation_frame', 'response_column', 'ignored_columns' ], findFormField

    if trainingFrameParameter
      if responseColumnParameter or ignoredColumnsParameter
        act trainingFrameParameter.value, (frameKey) ->
          if frameKey
            _.requestFrame frameKey, (error, frame) ->
              unless error
                columnValues = map frame.columns, (column) -> column.label
                columnLabels = map frame.columns, (column) -> 
                  missingPercent = 100 * column.missing / frame.rows
                  na = if missingPercent is 0 then '' else " (#{round missingPercent}% NA)"
                  label: "#{column.label}#{na}"
                  value: column.label
                if responseColumnParameter
                  responseColumnParameter.values columnValues
                if ignoredColumnsParameter
                  ignoredColumnsParameter.values columnLabels
          return

  collectParameters = (includeUnchangedParameters=no) ->
    parameters = {}
    for controls in _controlGroups
      for control in controls
        value = control.value()
        if includeUnchangedParameters or control.isRequired or (control.defaultValue isnt value) 
          switch control.kind
            when 'dropdown'
              if value
                parameters[control.name] = value
            when 'list'
              if value.length
                parameters[control.name] = value
            else
              parameters[control.name] = value
    parameters

  #
  # The 'checkForErrors' parameter exists so that we can conditionally choose 
  # to ignore validation errors. This is because we need the show/hide states 
  # for each field the first time around, but not the errors/warnings/info 
  # messages. 
  #
  # Thus, when this function is called during form init, checkForErrors is 
  #  passed in as 'false', and during form submission, checkForErrors is 
  #  passsed in as 'true'.
  #
  performValidations = (checkForErrors, go) ->
    _exception null
    parameters = collectParameters yes
    _validationFailureMessage ''

    _.requestModelInputValidation _algorithm, parameters, (error, modelBuilder) ->
      if error
        _exception Flow.Failure _, new Flow.Error 'Error fetching initial model builder state', error
      else
        hasErrors = no

        if modelBuilder.validation_messages.length
          validationsByControlName = groupBy modelBuilder.validation_messages, (validation) -> validation.field_name

          for controls in _controlGroups
            for control in controls
              if validations = validationsByControlName[control.name]
                for validation in validations
                  if validation.message_type is 'HIDE'
                    control.isVisible no
                  else
                    control.isVisible yes
                    if checkForErrors
                      switch validation.message_type
                        when 'INFO'
                          control.hasInfo yes
                          control.message validation.message
                        when 'WARN'
                          control.hasWarning yes
                          control.message validation.message
                        when 'ERROR'
                          control.hasError yes
                          control.message validation.message
                          hasErrors = yes
              else
                control.isVisible yes
                control.hasInfo no
                control.hasWarning no
                control.hasError no
                control.message ''

        if hasErrors
          _validationFailureMessage 'Your model parameters have one or more errors. Please fix them and try again.'
          # Do not pass go(). Do not collect $200.
        else
          _validationFailureMessage ''
          go() # Proceed with form submission

  createModel = ->
    _exception null
    performValidations yes, ->
      parameters = collectParameters no
      _.insertAndExecuteCell 'cs', "buildModel '#{_algorithm}', #{stringify parameters}"

  _revalidate = (value) ->
    if value isnt undefined # HACK: KO seems to be raising change notifications when dropdown boxes are initialized. 
      performValidations no, ->

  revalidate = throttle _revalidate, 100, leading: no

  # Kick off validations (minus error checking) to get hidden parameters
  performValidations no, ->
    for controls in _controlGroups
      for control in controls
        react control.value, revalidate
    return

  form: _form
  exception: _exception
  parameterTemplateOf: parameterTemplateOf
  createModel: createModel
  hasValidationFailures: _hasValidationFailures
  validationFailureMessage: _validationFailureMessage

H2O.ModelInput = (_, _go, _algo, _opts) ->
  _exception = signal null
  _algorithms = signal []
  _algorithm = signal null
  _canCreateModel = lift _algorithm, (algorithm) -> if algorithm then yes else no

  _modelForm = signal null

  populateFramesAndColumns = (frameKey, algorithm, parameters, go) ->

    destinationKeyParameter = find parameters, (parameter) -> parameter.name is 'destination_key'

    if destinationKeyParameter and not destinationKeyParameter.actual_value
      destinationKeyParameter.actual_value = "#{algorithm}-#{Flow.Util.uuid()}"

    #
    # Force classification.
    #
    classificationParameter = find parameters, (parameter) -> parameter.name is 'do_classification'

    if classificationParameter
      classificationParameter.actual_value = yes

    _.requestFrames (error, frames) ->
      if error
        #TODO handle properly
      else
        frameKeys = (frame.key.name for frame in frames)
        frameParameters = filter parameters, (parameter) -> parameter.type is 'Key<Frame>'
        for parameter in frameParameters
          parameter.values = frameKeys

          #TODO HACK
          if parameter.name is 'training_frame'
            if frameKey
              parameter.actual_value = frameKey
            else
              frameKey = parameter.actual_value

        return go()

  do ->
    _.requestModelBuilders (error, result) ->
      modelBuilders = if error then [] else result.model_builders
      _algorithms (key for key in keys modelBuilders when key isnt 'example')
      _algorithm _algo
      frameKey = _opts?.training_frame
      act _algorithm, (algorithm) ->
        if algorithm
          _.requestModelBuilder algorithm, (error, result) ->
            if error
              _exception Flow.Failure _, new Flow.Error 'Error fetching model builder', error
            else
              parameters = result.model_builders[algorithm].parameters
              populateFramesAndColumns frameKey, algorithm, parameters, ->
                _modelForm H2O.ModelBuilderForm _, algorithm, parameters
        else
          _modelForm null

  createModel = -> _modelForm().createModel()

  defer _go

  parentException: _exception #XXX hacky
  algorithms: _algorithms
  algorithm: _algorithm
  modelForm: _modelForm
  canCreateModel: _canCreateModel
  createModel: createModel
  template: 'flow-model-input'

