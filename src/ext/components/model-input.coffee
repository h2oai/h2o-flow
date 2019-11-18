{ defer, groupBy, map, filter, flatten, throttle, forEach, find } = require('lodash')

{ stringify, deepClone, isTruthy } = require('../../core/modules/prelude')
{ act, react, lift, link, signal } = require("../../core/modules/dataflow")

util = require('../../core/modules/util')
failure = require('../../core/components/failure')
FlowError = require('../../core/modules/flow-error')
{ ControlGroups, columnLabelsFromFrame } = require('./controls')

ModelBuilderForm = (_, _algorithm, _parameters) ->
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

  _controlGroups = ControlGroups _, _parameters

  # Show/hide grid settings if any controls are grid-ified.

  controls = flatten _controlGroups.list
  forEach controls, (control) ->
    react control.isGrided, ->
      _isGrided controls.some (c) -> c.isGrided()

  _form = _controlGroups.createForm()

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
    controls = flatten _controlGroups.list
    isGrided = controls.some (c) -> c.isGrided()

    parameters = {}
    hyperParameters = {}
    for control in controls
      value = _controlGroups.readControlValue(control)
      if control.isGrided()
        hyperParameters[control.name] = value
      else if value? and control.isVisible() and (includeUnchangedParameters or control.isRequired or (control.defaultValue isnt value))
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

          for control in flatten _controlGroups.list
            validations = validationsByControlName[control.name]
            _controlGroups.validateControl(control, validations, checkForErrors)
            hasErrors = hasErrors or control.hasError()

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
    for control in flatten _controlGroups.list
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

    if destinationKeyParameter and not destinationKeyParameter.value
      destinationKeyParameter.value = "#{algorithm}-#{util.uuid()}"

    #
    # Force classification.
    #
    classificationParameter = find parameters, (parameter) -> parameter.name is 'do_classification'

    if classificationParameter
      classificationParameter.value = yes

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
              parameter.value = frameKey
            else
              frameKey = parameter.value

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
          for param in parameters
            param.value = param.actual_value
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

