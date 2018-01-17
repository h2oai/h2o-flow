createControl = (kind, parameter) ->
  H2O.Util.createControl kind, parameter

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

  _textGrided = signal _text() + ';'

  textToValues = (text) ->
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

  _value = lift _text, textToValues

  _valueGrided = lift _textGrided, (text) ->
    values = []
    for part in "#{text}".split /\s*;\s*/g
      if token = part.trim()
        push values, textToValues token
    values

  control = createControl 'textbox', parameter
  control.text = _text
  control.textGrided = _textGrided
  control.value = _value
  control.valueGrided = _valueGrided
  control.isArrayValued = isArrayValued

  control

createGridableValues = (values, defaultValue) ->
  map values, (value) ->
    label: value
    value: signal true

createDropdownControl = (parameter) ->
  _value = signal parameter.actual_value

  control = createControl 'dropdown', parameter
  control.values = signals parameter.values
  control.value = _value
  control.gridedValues = lift control.values, (values) ->
    createGridableValues values
  control

createListControl = (parameter) ->
  H2O.Util.createListControl parameter

createCheckboxControl = (parameter) ->
  _value = signal parameter.actual_value

  control = createControl 'checkbox', parameter
  control.clientId = do uniqueId
  control.value = _value
  control

createModelsControl = (_, parameter) ->
  _models = signal []
  _frames = signal []
  _selectedFrame = signal null

  _isUpdatingSelectionCount = no
  blockSelectionUpdates = (f) ->
    _isUpdatingSelectionCount = yes
    f()
    _isUpdatingSelectionCount = no

  _.requestFrames (error, frames) ->
    unless error
      _frames (frame.frame_id.name for frame in frames)

  createModelItem = (modelKey) ->
    _isSelected = signal no

    value: modelKey
    isSelected: _isSelected

  createModelItems = (error, frame) ->
    _models map frame.compatible_models, createModelItem

  changeSelection = (source, value) ->
    for entry in source
      entry.isSelected value
    return

  selectFiltered = ->
    entries = _models()
    blockSelectionUpdates -> changeSelection entries, yes

  deselectFiltered = ->
    entries = _models()
    blockSelectionUpdates -> changeSelection entries, no

  lift _selectedFrame, (frameKey) ->
    if frameKey
      _.requestFrame frameKey, createModelItems, find_compatible_models: yes

  control = createControl 'models', parameter
  control.clientId = do uniqueId
  control.frames = _frames
  control.selectedFrame = _selectedFrame
  control.selectFiltered = selectFiltered
  control.deselectFiltered = deselectFiltered
  control.value = _models
  control

createControlFromParameter = (_, parameter) ->
  switch parameter.type
    when 'enum', 'Key<Frame>', 'VecSpecifier'
      createDropdownControl parameter
    when 'string[]'
      createListControl parameter
    when 'boolean'
      createCheckboxControl parameter
    when 'Key<Model>', 'string', 'byte', 'short', 'int', 'long', 'float', 'double', 'byte[]', 'short[]', 'int[]', 'long[]', 'float[]', 'double[]'
      createTextboxControl parameter, parameter.type
    when 'Key<Model>[]'
      createModelsControl _, parameter
    else
      console.error 'Invalid field', JSON.stringify parameter, null, 2
      null

H2O.ModelBuilderForm = (_, _algorithm, _parameters) ->
  _exception = signal null
  _validationFailureMessage = signal ''
  _hasValidationFailures = lift _validationFailureMessage, isTruthy

  _gridStrategies = [ 'Cartesian', 'RandomDiscrete' ]
  _isGrided = signal false
  _gridId = signal "grid-#{Flow.Util.uuid()}"
  _gridStrategy = signal 'Cartesian'
  _isGridRandomDiscrete = lift _gridStrategy, (strategy) -> strategy isnt _gridStrategies[0]
  _gridMaxModels = signal 1000
  _gridMaxRuntime = signal 28800
  _gridStoppingRounds = signal 0
  _gridStoppingMetrics = [ 'AUTO', 'deviance', 'logloss', 'MSE', 'AUC', 'lift_top_group', 'r2', 'misclassification' ]
  _gridStoppingMetric = signal _gridStoppingMetrics[0]
  _gridStoppingTolerance = signal 0.001

  _parametersByLevel = groupBy _parameters, (parameter) -> parameter.level
  _controlGroups = map [ 'critical', 'secondary', 'expert' ], (type) ->
    controls = map _parametersByLevel[type], (p) -> createControlFromParameter _, p
    controls = filter controls, (a) -> if a then yes else no
    # Show/hide grid settings if any controls are grid-ified.
    forEach controls, (control) ->
      react control.isGrided, ->
        isGrided = no
        for control in controls
          if control.isGrided()
            _isGrided isGrided = yes
            break
        unless isGrided
          _isGrided no

    controls

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
    [ trainingFrameParameter, validationFrameParameter, responseColumnParameter, ignoredColumnsParameter, offsetColumnsParameter, weightsColumnParameter, foldColumnParameter ] = map [ 'training_frame', 'validation_frame', 'response_column', 'ignored_columns', 'offset_column', 'weights_column', 'fold_column' ], findFormField

    if trainingFrameParameter
      if responseColumnParameter or ignoredColumnsParameter
        act trainingFrameParameter.value, (frameKey) ->
          if frameKey
            _.requestFrameSummaryWithoutData frameKey, (error, frame) ->
              unless error
                columnValues = map frame.columns, (column) -> column.label

                if responseColumnParameter
                  responseColumnParameter.values columnValues

                if ignoredColumnsParameter
                  ignoredColumnsParameter.values H2O.Util.columnLabelsFromFrame(frame)

                if weightsColumnParameter
                  weightsColumnParameter.values columnValues

                if foldColumnParameter
                  foldColumnParameter.values columnValues

                if offsetColumnsParameter
                  offsetColumnsParameter.values columnValues

                if responseColumnParameter and ignoredColumnsParameter
                  # Mark response column as 'unavailable' in ignored column list.
                  lift responseColumnParameter.value, (responseVariableName) ->
                    # FIXME
                    # ignoredColumnsParameter.unavailableValues [ responseVariableName ]

          return

  collectParameters = (includeUnchangedParameters=no) ->
    isGrided = no

    parameters = {}
    hyperParameters = {}
    for controls in _controlGroups
      for control in controls
        if control.isGrided()
          isGrided = yes
          switch control.kind
            when 'textbox'
              hyperParameters[control.name] = control.valueGrided()
            when 'dropdown'
              hyperParameters[control.name] = selectedValues = []
              for item in control.gridedValues()
                if item.value()
                  selectedValues.push item.label
            else # checkbox
              hyperParameters[control.name] = [ true, false ]
        else
          value = control.value()
          if control.isVisible() and (includeUnchangedParameters or control.isRequired or (control.defaultValue isnt value))
            switch control.kind
              when 'dropdown'
                if value
                  parameters[control.name] = value
              when 'list'
                if value.length
                  selectedValues = for entry in value when entry.isSelected()
                    entry.value
                  parameters[control.name] = selectedValues
              when 'models'
                selectedValues = for entry in value when entry.isSelected()
                  entry.value
                parameters[control.name] = selectedValues
              else
                parameters[control.name] = value
    if isGrided
      parameters.grid_id = _gridId()
      parameters.hyper_parameters = hyperParameters

      # { 'strategy': "RandomDiscrete/Cartesian", 'max_models': 3, 'max_runtime_secs': 20 }

      searchCriteria =
        strategy: _gridStrategy()
      switch searchCriteria.strategy
        when 'RandomDiscrete'
          unless isNaN maxModels = parseInt _gridMaxModels(), 10
            searchCriteria.max_models = maxModels
          unless isNaN maxRuntime = parseInt _gridMaxRuntime(), 10
            searchCriteria.max_runtime_secs = maxRuntime
          unless isNaN gridStoppingRounds = parseInt _gridStoppingRounds(), 10
            searchCriteria.stopping_rounds = gridStoppingRounds
          unless isNaN stoppingTolerance = parseFloat _gridStoppingTolerance()
            searchCriteria.stopping_tolerance = stoppingTolerance
          searchCriteria.stopping_metric = _gridStoppingMetric()
      parameters.search_criteria = searchCriteria

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

    if parameters.hyper_parameters
      return go() # parameter validation fails with hyper_parameters, so skip.

    _validationFailureMessage ''

    _.requestModelInputValidation _algorithm, parameters, (error, modelBuilder) ->
      if error
        _exception Flow.Failure _, new Flow.Error 'Error fetching initial model builder state', error
      else
        hasErrors = no

        if modelBuilder.messages.length
          validationsByControlName = groupBy modelBuilder.messages, (validation) -> validation.field_name

          for controls in _controlGroups
            for control in controls
              if validations = validationsByControlName[control.name]
                for validation in validations
                  if validation.message_type is 'TRACE'
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
                        when 'ERRR'
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
  isGrided: _isGrided
  gridId: _gridId
  gridStrategy: _gridStrategy
  gridStrategies: _gridStrategies
  isGridRandomDiscrete: _isGridRandomDiscrete
  gridMaxModels: _gridMaxModels
  gridMaxRuntime: _gridMaxRuntime
  gridStoppingRounds: _gridStoppingRounds
  gridStoppingMetrics: _gridStoppingMetrics
  gridStoppingMetric: _gridStoppingMetric
  gridStoppingTolerance: _gridStoppingTolerance
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

    destinationKeyParameter = find parameters, (parameter) -> parameter.name is 'model_id'

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
        frameKeys = (frame.frame_id.name for frame in frames)
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
    _.requestModelBuilders (error, modelBuilders) ->
      _algorithms modelBuilders
      _algorithm if _algo then (find modelBuilders, (builder) -> builder.algo is _algo) else undefined
      frameKey = _opts?.training_frame
      act _algorithm, (builder) ->
        if builder
          algorithm = builder.algo
          parameters = deepClone builder.parameters
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

