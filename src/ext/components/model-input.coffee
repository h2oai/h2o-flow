{ defer, groupBy, map, filter, throttle, forEach, find, uniqueId } = require('lodash')

{ stringify, deepClone, isTruthy } = require('../../core/modules/prelude')
{ act, react, lift, link, signal, signals } = require("../../core/modules/dataflow")

util = require('../../core/modules/util')
{ createControl, createListControl, columnLabelsFromFrame } = require('../modules/util')
failure = require('../../core/components/failure')
FlowError = require('../../core/modules/flow-error')

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
  
  _text = signal if isArrayValued then (parameter.actual_value ? []).join ', ' else (parameter.actual_value ? '')

  _textGrided = signal _text() + ';'

  textToValues = (text) ->
    if isArrayValued
      vals = []
      for value in text.split /\s*,\s*/g
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
        values.push textToValues token
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
  _checkAllModels = signal false

  _.requestFrames (error, frames) ->
    unless error
      _frames (frame.frame_id.name for frame in frames)

  createModelItem = (modelKey) ->
    _isSelected = signal no

    value: modelKey
    isSelected: _isSelected

  createModelItems = (error, frame) ->
    _models map frame.compatible_models, createModelItem

  _isCheckingAll = no
  lift _checkAllModels, (checkAll) ->
    _isCheckingAll = yes
    for view in _models()
      view.isSelected checkAll
    _isCheckingAll = no
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
  control.checkAllModels = _checkAllModels
  control.value = _models
  control

createStringPairsControl = (parameter) ->
  _pairs = signal []
  _columns = signal []

  react _columns, () ->
    _pairs []

  pairEquals = (pair, leftValue, rightValue) ->
      return (pair.leftColumn() == leftValue and pair.rightColumn() == rightValue) or (pair.rightColumn() == leftValue and pair.leftColumn() == rightValue)

  pairExists = (leftValue, rightValue) ->
    samePairs = (pair for pair in _pairs() when pairEquals(pair, leftValue, rightValue))
    return samePairs.length != 0

  _stringPair = (leftValue, rightValue) ->
    _leftColumn = signal leftValue
    _rightColumn = signal rightValue
    _id = signal uniqueId()

    leftColumn: _leftColumn
    rightColumn: _rightColumn
    id: _id
    remove: ->
      _pairs (entry for entry in _pairs() when entry.id() != _id())

  _pairConstructor = ->
    _leftColumn = signal ''
    _leftColumns = signal _columns()
    _leftSelected = signal no

    _rightColumn = signal ''
    _rightColumns = signal []

    _calculateRightColumns = ->
      _rightColumns (entry for entry in _leftColumns() when entry != _leftColumn() and not pairExists(_leftColumn(), entry))

    react _leftColumn, (leftColumn) ->
      if leftColumn
        _calculateRightColumns()
        _leftSelected yes
      else
        _rightColumns []
        _leftSelected no

    react _pairs, () ->
      _calculateRightColumns()

    leftColumn: _leftColumn
    leftColumns: _leftColumns
    leftSelected: _leftSelected
    rightColumn: _rightColumn
    rightColumns: _rightColumns
    create: ->
      if not _rightColumn() or not _leftColumn() or pairExists(_leftColumn(), _rightColumn())
        return
      new_entries = _pairs()
      new_entries.push _stringPair(_leftColumn(), _rightColumn())
      _pairs new_entries

  _pairToValue = (pairs) ->
    result = []
    for pair in pairs
      result.push {a: pair.leftColumn(), b: pair.rightColumn()}
    return result

  _value = lift _pairs, _pairToValue

  control = createControl 'stringpairs', parameter
  control.value = _value
  control.newPair = _pairConstructor
  control.pairs = _pairs
  control.columns = _columns
  control

createMonotoneContraintsControl = (opts, valueEncoder, parameter) ->
  _keyValues = signal []
  _columns = signal []

  react _columns, () ->
    _keyValues []

  _keyValueObject = (key, value) ->
    _key = signal key
    _value = signal value
    _id = signal uniqueId()

    key: _key
    value: _value
    id: _id
    encodedValue: ->
      valueEncoder _value()
    remove: ->
      _keyValues (entry for entry in _keyValues() when entry.id() != _id())

  _keyValueConstructor = ->
    _key = signal ''
    _keyOpts = signal _columns()
    _keySelected = signal no

    _value = signal ''
    _valueOpts = signal []

    react _key, (value) ->
      if value
        _keySelected yes
        _valueOpts opts
      else
        _keySelected no
        _valueOpts []
    
    _keyValueExists = (checkedKey) ->
      sameKeys = (keyValue for keyValue in _keyValues() when keyValue.key() == checkedKey)
      return sameKeys.length != 0

    react _keyValues, (_) ->
      _keyOpts (key for key in _keyOpts() when not _keyValueExists(key))
      _key null

    key: _key
    keyOpts: _keyOpts
    keySelected: _keySelected
    value: _value
    valueOpts: _valueOpts
    create: ->
      if not _key() or not _value() or _keyValueExists(_key())
        return
      new_entries = _keyValues()
      new_entries.push _keyValueObject(_key(), _value())
      _keyValues new_entries

  _keyValuesToValue = (keyValues) ->
    result = []
    keyValues.forEach (keyValue) ->
      result.push {key: keyValue.key(), value: keyValue.encodedValue()}
    result

  control = createControl 'keyvalues', parameter
  control.value = lift _keyValues, _keyValuesToValue
  control.columns = _columns
  control.keyValues = _keyValues
  control.newKeyValue = _keyValueConstructor
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
    when 'StringPair[]'
      createStringPairsControl parameter
    when 'KeyValue[]'
      if parameter.name is 'monotone_constraints'
        increasing = 'Increasing'
        decreasing = 'Decreasing'
        valueEncoder = (value) ->
          switch value
            when increasing
              return 1
            when decreasing
              return -1
            else
              console.error "Unknown value #{_value()} to encode."
              return 0
        createMonotoneContraintsControl [increasing, decreasing], valueEncoder, parameter
    else
      console.error 'Invalid field', JSON.stringify parameter, null, 2
      null

exports.ModelBuilderForm = ModelBuilderForm = (_, _algorithm, _parameters) ->
  _exception = signal null
  _validationFailureMessage = signal ''
  _hasValidationFailures = lift _validationFailureMessage, isTruthy

  _gridStrategies = [ 'Cartesian', 'RandomDiscrete' ]
  _isGrided = signal false
  _gridId = signal "grid-#{util.uuid()}"
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
    [ trainingFrameParameter,
      validationFrameParameter,
      responseColumnParameter,
      ignoredColumnsParameter,
      offsetColumnsParameter,
      weightsColumnParameter,
      foldColumnParameter,
      interactionsParameter,
      metalearnerFoldColumnParameter,
      interactionPairsParameter,
      monotoneConstraintsParameter,
      startColumnParameter,
      stopColumnParameter
    ] = map [
      'training_frame',
      'validation_frame',
      'response_column',
      'ignored_columns',
      'offset_column',
      'weights_column',
      'fold_column',
      'interactions',
      'metalearner_fold_column',
      'interaction_pairs',
      'monotone_constraints',
      'start_column',
      'stop_column'
    ], findFormField

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
                  ignoredColumnsParameter.values columnLabelsFromFrame(frame)

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

                if interactionsParameter
                  interactionsParameter.values columnLabelsFromFrame(frame)

                if metalearnerFoldColumnParameter
                  metalearnerFoldColumnParameter.values columnValues

                if interactionPairsParameter
                  interactionPairsParameter.columns columnValues

                if monotoneConstraintsParameter
                  monotoneConstraintsParameter.columns columnValues

                if startColumnParameter
                  startColumnParameter.values columnValues

                if stopColumnParameter
                  stopColumnParameter.values columnValues

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
        _exception failure _, new FlowError 'Error fetching initial model builder state', error
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

exports.ModelInput = (_, _go, _algo, _opts) ->
  _exception = signal null
  _algorithms = signal []
  _algorithm = signal null
  _canCreateModel = lift _algorithm, (algorithm) -> if algorithm then yes else no

  _modelForm = signal null

  populateFramesAndColumns = (frameKey, algorithm, parameters, go) ->

    destinationKeyParameter = find parameters, (parameter) -> parameter.name is 'model_id'

    if destinationKeyParameter and not destinationKeyParameter.actual_value
      destinationKeyParameter.actual_value = "#{algorithm}-#{util.uuid()}"

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
            _modelForm ModelBuilderForm _, algorithm, parameters
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

