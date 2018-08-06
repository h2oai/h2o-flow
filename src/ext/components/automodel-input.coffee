H2O.AutoModelInput = (_, _go, opts={}) ->
  _projectName = signal null
  _trainingFrames = signal []
  _trainingFrame = signal null
  _validationFrames = signal []
  _validationFrame = signal null
  _leaderboardFrames = signal []
  _leaderboardFrame = signal null
  _hasTrainingFrame = lift _trainingFrame, (frame) -> if frame then yes else no
  _columns = signal []
  _column = signal null
  _foldColumn = signal null
  _weightsColumn = signal null
  _canBuildModel = lift _trainingFrame, _column, (frame, column) -> frame and column

  # TODO loss
  defaultSeed = -1
  _seed = signal defaultSeed
  defaultMaxModels = 0
  _maxModels = signal ''
  defaultMaxRunTime = 3600
  _maxRuntimeSecs = signal defaultMaxRunTime
  _stoppingMetrics = signal []
  _stoppingMetric = signal null
  _sortMetrics = signal []
  _sortMetric = signal null
  defaultStoppingRounds = 3
  _stoppingRounds = signal defaultStoppingRounds
  defaultStoppingTolerance = -1
  _stoppingTolerance = signal ''
  _balanceClasses = signal no
  _classSamplingFactors = signal null
  defaultMaxAfterBalanceSize = 5
  _maxAfterBalanceSize = signal defaultMaxAfterBalanceSize

  _ignoredColumnsControl = H2O.Util.createListControl({
      name: 'ignored_columns',
      label: 'Ignored Columns',
      required: no,
      gridable: no
  })

  _excludeAlgosControl = H2O.Util.createListControl({
      name: 'exclude_algos',
      label: 'Exclude these algorithms',
      required: no,
      gridable: no
  })
  excludeAlgosValues = [{value: 'GLM'}, {value: 'DRF'}, {value: 'GBM'}, {value: 'DeepLearning'}, {value: 'StackedEnsemble'}]
  _excludeAlgosControl.values excludeAlgosValues

  defaultNfolds = 5
  _nfolds = signal defaultNfolds

  _keepCrossValidationPredictions = signal yes
  _keepCrossValidationModels = signal yes

  buildModel = ->
    seed = defaultSeed
    unless isNaN parsed = parseInt _seed(), 10
      seed = parsed

    maxModels = defaultMaxModels
    unless isNaN parsed = parseInt _maxModels(), 10
      maxModels = parsed

    maxRuntimeSecs = defaultMaxRunTime
    unless isNaN parsed = parseInt _maxRuntimeSecs(), 10
      maxRuntimeSecs = parsed

    stoppingRounds = defaultStoppingRounds
    unless isNaN parsed = parseInt _stoppingRounds(), 10
      stoppingRounds = parsed

    stoppingTolerance = defaultStoppingTolerance
    unless isNaN parsed = parseFloat _stoppingTolerance()
      stoppingTolerance = parsed

    nfolds = defaultNfolds
    unless isNaN parsed = parseInt _nfolds()
      nfolds = parsed

    sortMetric = _sortMetric()
    if sortMetric is 'deviance'
      sortMetric = 'mean_residual_deviance'
    if sortMetric is 'AUTO'
      sortMetric = null

    classSamplingFactors = []
    for value in split(_classSamplingFactors() ? '', /\s*,\s*/g)
      unless isNaN parsed = parseFloat value
        classSamplingFactors.push parsed
    if classSamplingFactors is []
      classSamplingFactors = null

    maxAfterBalanceSize = defaultMaxAfterBalanceSize
    unless isNaN parsed = parseInt _maxAfterBalanceSize(), 10
      maxAfterBalanceSize = parsed

    # TODO loss
    arg =
      training_frame: _trainingFrame()
      response_column: _column()
      fold_column: _foldColumn()
      weights_column: _weightsColumn()
      validation_frame: _validationFrame()
      leaderboard_frame: _leaderboardFrame()
      seed: seed
      max_models: maxModels
      max_runtime_secs: maxRuntimeSecs
      stopping_metric: _stoppingMetric()
      sort_metric: sortMetric
      stopping_rounds: stoppingRounds
      stopping_tolerance: stoppingTolerance
      nfolds: nfolds
      balance_classes: _balanceClasses()
      class_sampling_factors: classSamplingFactors
      max_after_balance_size: maxAfterBalanceSize
      keep_cross_validation_predictions: _keepCrossValidationPredictions()
      keep_cross_validation_models: _keepCrossValidationModels()
      ignored_columns: for entry in _ignoredColumnsControl.value() when entry.isSelected()
          entry.value
      exclude_algos: for entry in _excludeAlgosControl.value() when entry.isSelected()
          entry.value
    if _projectName() and _projectName().trim() != ''
      arg.project_name = _projectName().trim()

    _.insertAndExecuteCell 'cs', "runAutoML #{JSON.stringify arg}"

  _.requestFrames (error, frames) ->
    unless error
      frames = (frame.frame_id.name for frame in frames when not frame.is_text)
      _trainingFrames frames
      _validationFrames frames
      _leaderboardFrames frames
      if opts.training_frame
        _trainingFrame opts.training_frame
      if opts.validation_frame
        _validationFrame opts.validation_frame
      if opts.leaderboard_frame
        _leaderboardFrame opts.leaderboard_frame

      return
  
  findSchemaField = (schema, name) ->
    for field in schema.fields when field.schema_name is name
      return field

  _.requestSchema 'RandomDiscreteValueSearchCriteriaV99', (error, response) ->
    unless error
      schema = head response.schemas

      # TODO loss enum

      if field = findSchemaField schema, 'ScoreKeeperStoppingMetric'
        _stoppingMetrics field.values
        _sortMetrics field.values


  react _trainingFrame, (frame) ->
    if frame
      _.requestFrameSummaryWithoutData frame, (error, frame) ->
        unless error
          _columns (column.label for column in frame.columns)

          _ignoredColumnsControl.values H2O.Util.columnLabelsFromFrame(frame)

          if opts.response_column
            _column opts.response_column
            delete opts.response_column #HACK
    else
      _columns []
  
  defer _go

  projectName: _projectName
  trainingFrames: _trainingFrames
  trainingFrame: _trainingFrame
  hasTrainingFrame: _hasTrainingFrame
  validationFrames: _validationFrames
  validationFrame: _validationFrame
  leaderboardFrames: _leaderboardFrames
  leaderboardFrame: _leaderboardFrame
  columns: _columns
  column: _column
  foldColumn: _foldColumn
  weightsColumn: _weightsColumn
  seed: _seed
  maxModels: _maxModels
  maxRuntimeSecs: _maxRuntimeSecs
  stoppingMetrics: _stoppingMetrics
  stoppingMetric: _stoppingMetric
  sortMetrics: _sortMetrics
  sortMetric: _sortMetric
  stoppingRounds: _stoppingRounds
  stoppingTolerance: _stoppingTolerance
  nfolds: _nfolds
  keepCrossValidationPredictions: _keepCrossValidationPredictions
  keepCrossValidationModels: _keepCrossValidationModels
  balanceClasses: _balanceClasses
  classSamplingFactors: _classSamplingFactors
  maxAfterBalanceSize: _maxAfterBalanceSize
  canBuildModel: _canBuildModel
  buildModel: buildModel
  template: 'flow-automodel-input'
  ignoredColumnsControl: _ignoredColumnsControl
  excludeAlgosControl: _excludeAlgosControl
