{ defer, map, head } = require('lodash')

{ react, lift, link, signal, signals } = require("../../core/modules/dataflow")
{ stringify, isTruthy } = require('../../core/modules/prelude')
util = require('../modules/util')
{ ControlGroups } = require('./model-input')

AutoMLForm = (_, _parameters) ->
  _exception = signal null
  _validationFailureMessage = signal ''
  _hasValidationFailures = lift _validationFailureMessage, isTruthy

  _validParameters = (p for p in _parameters when p.name not in ['algo_parameters', 'modeling_plan' ])
  _controlGroups = ControlGroups _,  _validParameters
  _form = _controlGroups.createForm()

  _parameterTemplateOf = (control) -> "flow-#{control.kind}-model-parameter"

  exception: _exception
  form: _form
  parameterTemplateOf: _parameterTemplateOf


module.exports = (_, _go, opts={}) ->
  _automlForm = signal null
  _projectName = signal null
  _trainingFrames = signal []
  _trainingFrame = signal null
  _validationFrames = signal []
  _validationFrame = signal null
  _blendingFrames = signal []
  _blendingFrame = signal null
  _leaderboardFrames = signal []
  _leaderboardFrame = signal null
  _hasTrainingFrame = lift _trainingFrame, (frame) -> if frame then yes else no
  _columns = signal []
  _column = signal null
  _foldColumn = signal null
  _weightsColumn = signal null
  _canRunAutoML = lift _trainingFrame, _column, (frame, column) -> frame and column

  # TODO loss
  defaultSeed = -1
  _seed = signal defaultSeed
  defaultMaxModels = 0
  _maxModels = signal ''
  defaultMaxRunTime = 3600
  _maxRuntimeSecs = signal defaultMaxRunTime
  defaultMaxRunTimePerModel = 0
  _maxRuntimeSecsPerModel = signal defaultMaxRunTimePerModel
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

  _ignoredColumnsControl = util.createListControl({
      name: 'ignored_columns',
      label: 'Ignored Columns',
      required: no,
      gridable: no
  })

  _excludeAlgosControl = util.createListControl({
      name: 'exclude_algos',
      label: 'Exclude these algorithms',
      required: no,
      gridable: no
  })
  excludeAlgosValues = [{value: 'GLM'}, {value: 'DRF'}, {value: 'GBM'}, {value: 'XGBoost'}, {value: 'DeepLearning'}, {value: 'StackedEnsemble'}]
  _excludeAlgosControl.values excludeAlgosValues

  defaultNfolds = 5
  _nfolds = signal defaultNfolds

  _keepCrossValidationPredictions = signal yes
  _keepCrossValidationModels = signal yes
  _keepCrossValidationFoldAssignment = signal no
  _exportCheckpointsDir = signal ""

  runAutoML = ->
    seed = defaultSeed
    unless isNaN parsed = parseInt _seed(), 10
      seed = parsed

    maxModels = defaultMaxModels
    unless isNaN parsed = parseInt _maxModels(), 10
      maxModels = parsed

    maxRuntimeSecs = defaultMaxRunTime
    unless isNaN parsed = parseInt _maxRuntimeSecs(), 10
      maxRuntimeSecs = parsed

    maxRuntimeSecsPerModel = defaultMaxRunTimePerModel
    unless isNaN parsed = parseInt _maxRuntimeSecsPerModel(), 10
      maxRuntimeSecsPerModel = parsed

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
    for value in (_classSamplingFactors() ? '').split /\s*,\s*/g
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
      blending_frame: _blendingFrame()
      leaderboard_frame: _leaderboardFrame()
      seed: seed
      max_models: maxModels
      max_runtime_secs: maxRuntimeSecs
      max_runtime_secs_per_model: maxRuntimeSecsPerModel
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
      keep_cross_validation_fold_assignment: _keepCrossValidationFoldAssignment()
      export_checkpoints_dir: _exportCheckpointsDir()
      ignored_columns: for entry in _ignoredColumnsControl.value() when entry.isSelected()
          entry.value
      exclude_algos: for entry in _excludeAlgosControl.value() when entry.isSelected()
          entry.value
    if _projectName() and _projectName().trim() != ''
      arg.project_name = _projectName().trim()

    _.insertAndExecuteCell 'cs', "runAutoML_ #{stringify arg}"

  _.requestFrames (error, frames) ->
    unless error
      frames = (frame.frame_id.name for frame in frames when not frame.is_text)
      _trainingFrames frames
      _validationFrames frames
      _blendingFrames frames
      _leaderboardFrames frames
      if opts.training_frame
        _trainingFrame opts.training_frame
      if opts.validation_frame
        _validationFrame opts.validation_frame
      if opts.blending_frame
        _blendingFrame opts.blending_frame
      if opts.leaderboard_frame
        _leaderboardFrame opts.leaderboard_frame

      return
  
  findSchemaField = (schema, name) ->
    for field in schema.fields when field.schema_name is name
      return field

  loadFields = (schema_name, path, with_fields) ->
    _.requestSchema schema_name, (error, response) ->
      if error
        with_fields null, error
      else
        schema = head response.schemas
        with_fields schema.fields, path

  requestBuilderParameters = (go) ->
    waiting = signal 0
    parameters = []
    acc = (fields, path) ->
      if fields is null
        go path, null
        return
      for field in fields
        if field.is_schema and field.value?.__meta
          path = if path == '' then field.name else path+'.'+field.name
          waiting waiting()+1
          loadFields field.schema_name, path, acc
        else if field.direction in ['INPUT', 'INOUT']
          field.path = path
          parameters.push field
      waiting waiting()-1

    waiting waiting()+1
    loadFields 'AutoMLBuildSpecV99', '', acc
    react waiting, (w) -> if w == 0 then go(null, parameters)

  react _trainingFrame, (frame) ->
    if frame
      _.requestFrameSummaryWithoutData frame, (error, frame) ->
        unless error
          _columns (column.label for column in frame.columns)
          _ignoredColumnsControl.values util.columnLabelsFromFrame(frame)
          if opts.response_column
            _column opts.response_column
            delete opts.response_column #HACK
    else
      _columns []
  
  do ->
    requestBuilderParameters (error, parameters)  ->
      unless error
        _automlForm AutoMLForm _, parameters

  defer _go

  automlForm: _automlForm
  canRunAutoML: _canRunAutoML
  runAutoML: runAutoML
  template: 'flow-automl-input'


