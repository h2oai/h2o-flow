{ flatten, compact, keyBy, findIndex,
  isFunction, isString, isNumber, isArray, isObject,
  map, uniq, head, keys, range, escape, sortBy, some, 
  tail, concat, values } = require('lodash')

{ words, typeOf, stringify } = require('../../core/modules/prelude')
{ act, react, lift, link, merge, isSignal, signal, signals } = require("../../core/modules/dataflow")
{ TString, TNumber } = require('../../core/modules/types')
async = require('../../core/modules/async')
html = require('../../core/modules/html')
FlowError = require('../../core/modules/flow-error')
objectBrowser = require('../../core/components/object-browser')
util = require('../../core/modules/util')
gui = require('../../core/modules/gui')
form = require('../../core/components/form')
h2o = require('./h2o')
lightning = require('../../core/modules/lightning')

_assistance =
  importFiles:
    description: 'Import file(s) into H<sub>2</sub>O'
    icon: 'files-o'
  importSqlTable:
    description: 'Import SQL table into H<sub>2</sub>O'
    icon: 'table'
  getFrames:
    description: 'Get a list of frames in H<sub>2</sub>O'
    icon: 'table'
  splitFrame:
    description: 'Split a frame into two or more frames'
    icon: 'scissors'
  mergeFrames:
    description: 'Merge two frames into one'
    icon: 'link'
  getModels:
    description: 'Get a list of models in H<sub>2</sub>O'
    icon: 'cubes'
  getGrids:
    description: 'Get a list of grid search results in H<sub>2</sub>O'
    icon: 'th'
  getPredictions:
    description: 'Get a list of predictions in H<sub>2</sub>O'
    icon: 'bolt'
  getJobs:
    description: 'Get a list of jobs running in H<sub>2</sub>O'
    icon: 'tasks'
  runAutoML:
    description: 'Automatically train and tune many models'
    icon: 'sitemap'
  buildModel:
    description: 'Build a model'
    icon: 'cube'
  importModel:
    description: 'Import a saved model'
    icon: 'cube'
  predict:
    description: 'Make a prediction'
    icon: 'bolt'

parseNumbers = (source) ->
  target = new Array source.length
  for value, i in source
    target[i] = if value is 'NaN'
      undefined
    else if value is 'Infinity'
      Number.POSITIVE_INFINITY #TODO handle formatting
    else if value is '-Infinity'
      Number.NEGATIVE_INFINITY #TODO handle formatting
    else
      value
  target

convertColumnToVector = (column, data) ->
  switch column.type
    when 'byte', 'short', 'int', 'integer', 'long'
      lightning.createVector column.name, TNumber, parseNumbers data
    when 'float', 'double'
      lightning.createVector column.name, TNumber, (parseNumbers data), format4f
    when 'string'
      lightning.createFactor column.name, TString, data
    when 'matrix'
      lightning.createList column.name, data, formatConfusionMatrix
    else
      lightning.createList column.name, data

convertTableToFrame = (table, tableName, metadata) ->
  #TODO handle format strings and description
  vectors = for column, i in table.columns
    convertColumnToVector column, table.data[i]
  lightning.createDataFrame tableName, vectors, (range table.rowcount), null, metadata

getTwoDimData = (table, columnName) ->
  columnIndex = findIndex table.columns, (column) -> column.name is columnName
  if columnIndex >= 0
    table.data[columnIndex]
  else
    undefined

format4f = (number) ->
  if number
    if number is 'NaN'
      undefined
    else
      number.toFixed(4).replace(/\.0+$/, '.0')
  else
    number

format6fi = (number) ->
  if number
    if number is 'NaN'
      undefined
    else
      number.toFixed(6).replace(/\.0+$/, '')
  else
    number

combineTables = (tables) ->
  leader = head tables

  rowCount = 0
  columnCount = leader.data.length
  data = new Array columnCount

  for table in tables
    rowCount += table.rowcount

  for i in [0 ... columnCount]
    data[i] = columnData = new Array rowCount
    index = 0
    for table in tables
      for element in table.data[i]
        columnData[index++] = element

  name: leader.name
  columns: leader.columns
  data: data
  rowcount: rowCount

createArrays = (count, length) ->
  for i in [0 ... count]
    new Array length

parseNaNs = (source) ->
  target = new Array source.length
  for element, i in source
    target[i] = if element is 'NaN' then undefined else element
  target

parseNulls = (source) ->
  target = new Array source.length
  for element, i in source
    target[i] = if element? then element else undefined
  target

parseAndFormatArray = (source) ->
  target = new Array source.length
  for element, i in source
    target[i] = if element?
      if isNumber element
        format6fi element
      else
        element
    else
      undefined
  target

parseAndFormatObjectArray = (source) ->
  target = new Array source.length
  for element, i in source
    target[i] = if element?
      if element.__meta?.schema_type is 'Key<Model>'
        "<a href='#' data-type='model' data-key=#{stringify element.name}>#{escape element.name}</a>"
      else if element.__meta?.schema_type is 'Key<Frame>'
        "<a href='#' data-type='frame' data-key=#{stringify element.name}>#{escape element.name}</a>"
      else
        element
    else
      undefined
  target

repeatValues = (count, value) ->
  target = new Array count
  for i in [0 ... count]
    target[i] = value
  target

concatArrays = (arrays) ->
  switch arrays.length
    when 0
      []
    when 1
      head arrays
    else
      a = head arrays
      a.concat.apply a, tail arrays

computeTruePositiveRate = (cm) ->
  [[tn, fp], [fn, tp]] = cm
  tp / (tp + fn)

computeFalsePositiveRate = (cm) ->
  [[tn, fp], [fn, tp]] = cm
  fp / (fp + tn)

formatConfusionMatrix = (cm) ->
  [[tn, fp], [fn, tp]] = cm.matrix
  fnr = fn / (tp + fn)
  fpr = fp / (fp + tn)
  domain = cm.domain

  [ table, tbody, tr, strong, normal, yellow ] = html.template 'table.flow-matrix', 'tbody', 'tr', 'td.strong.flow-center', 'td', 'td.bg-yellow'

  table [
    tbody [
      tr [
        strong 'Actual/Predicted'
        strong domain[0]
        strong domain[1]
        strong 'Error'
        strong 'Rate'
      ]
      tr [
        strong domain[0]
        yellow tn
        normal fp
        normal format4f fpr
        normal fp + ' / ' + (fp + tn)
      ]
      tr [
        strong domain[1]
        normal fn
        yellow tp
        normal format4f fnr
        normal fn + ' / ' + (tp + fn)
      ]
      tr [
        strong 'Total'
        strong tn + fn
        strong tp + fp
        strong format4f (fn + fp) / (fp + tn + tp + fn)
        strong (fn + fp) + ' / ' + (fp + tn + tp + fn)
      ]
    ]
  ]

formulateGetPredictionsOrigin = (opts) ->
  if isArray opts
    sanitizedOpts = for opt in opts
      sanitizedOpt = {}
      sanitizedOpt.model = opt.model if opt.model
      sanitizedOpt.frame = opt.frame if opt.frame
      sanitizedOpt
    "getPredictions #{stringify sanitizedOpts}"
  else
    { model: modelKey, frame: frameKey } = opts
    if modelKey and frameKey
      "getPredictions model: #{stringify modelKey}, frame: #{stringify frameKey}"
    else if modelKey
      "getPredictions model: #{stringify modelKey}"
    else if frameKey
      "getPredictions frame: #{stringify frameKey}"
    else
      "getPredictions()"

exports.init = (_) ->
  #TODO move these into async
  _fork = (f, args...) -> async.fork f, args
  _join = (args..., go) -> async.join args, async.applicate go
  _call = (go, args...) -> async.join args, async.applicate go
  _apply = (go, args) -> async.join args, go
  _isFuture = async.isFuture
  _async = async.async
  _get = async.get

  #XXX obsolete
  proceed = (func, args, go) ->
    go null, render_ {}, -> func.apply null, [_].concat args or []

  proceed = (func, args, go) ->
    go null, render_.apply null, [ {}, func, ].concat args or []

  extendGuiForm = (f) ->
    render_ f, form, f

  createGui = (controls, go) ->
    go null, extendGuiForm signals controls or []

  gui = (controls) ->
    _fork createGui, controls

  gui[name] = f for name, f of gui

  flow_ = (raw) ->
    raw._flow_ or raw._flow_ = _cache_: {}

  #XXX obsolete
  render_ = (raw, render) ->
    (flow_ raw).render = render
    raw

  render_ = (raw, render, args...) ->
    (flow_ raw).render = (go) ->
      # Prepend current context (_) and a continuation (go)
      render.apply null, [_, go].concat args
    raw

  inspect_ = (raw, inspectors) ->
    root = flow_ raw
    root.inspect = {} unless root.inspect?
    for attr, f of inspectors
      root.inspect[attr] = f
    raw

  inspect = (a, b) ->
    if arguments.length is 1
      inspect$1 a
    else
      inspect$2 a, b

  inspect$1 = (obj) ->
    if _isFuture obj
      _async inspect, obj
    else
      if inspectors = obj?._flow_?.inspect
        inspections = []
        for attr, f of inspectors
          inspections.push inspect$2 attr, obj
        render_ inspections, h2o.InspectsOutput, inspections
        inspections
      else
        {}

  ls = (obj) ->
    if _isFuture obj
      _async ls, obj
    else
      if inspectors = obj?._flow_?.inspect
        keys inspectors
      else
        []

  inspect$2 = (attr, obj) ->
    return unless attr
    return _async inspect, attr, obj if _isFuture obj
    return unless obj
    return unless root = obj._flow_
    return unless inspectors = root.inspect
    return cached if cached = root._cache_[ key = "inspect_#{attr}" ]
    return unless f = inspectors[attr]
    return unless isFunction f
    root._cache_[key] = inspection = f()
    render_ inspection, h2o.InspectOutput, inspection
    inspection

  _plot = (render, go) ->
    render (error, vis) ->
      if error
        go new FlowError 'Error rendering vis.', error
      else
        go null, vis

  extendPlot = (vis) ->
    render_ vis, h2o.PlotOutput, vis.element

  createPlot = (f, go) ->
    _plot (f lightning), (error, vis) ->
      if error
        go error
      else
        go null, extendPlot vis

  plot = (f) ->
    if _isFuture f
      _fork proceed, h2o.PlotInput, f
    else if isFunction f
      _fork createPlot, f
    else
      assist plot

  grid = (f) ->
    plot (g) -> g(
      g.select()
      g.from f
    )

  transformBinomialMetrics = (metrics) ->
    if scores = metrics.thresholds_and_metric_scores
      domain = metrics.domain
      tps = getTwoDimData scores, 'tps'
      tns = getTwoDimData scores, 'tns'
      fps = getTwoDimData scores, 'fps'
      fns = getTwoDimData scores, 'fns'

      cms = for tp, i in tps
        domain: domain
        matrix: [[tns[i], fps[i]], [fns[i], tp]]

      scores.columns.push
        name: 'CM'
        description: 'CM'
        format: 'matrix' #TODO HACK
        type: 'matrix'
      scores.data.push cms

    metrics

  extendCloud = (cloud) ->
    render_ cloud, h2o.CloudOutput, cloud

  extendTimeline = (timeline) ->
    render_ timeline, h2o.TimelineOutput, timeline

  extendStackTrace = (stackTrace) ->
    render_ stackTrace, h2o.StackTraceOutput, stackTrace

  extendLogFile = (cloud, nodeIpPort, fileType, logFile) ->
    render_ logFile, h2o.LogFileOutput, cloud, nodeIpPort, fileType, logFile

  inspectNetworkTestResult = (testResult) -> ->
    convertTableToFrame testResult.table, testResult.table.name,
      description: testResult.table.name
      origin: "testNetwork"

  extendNetworkTest = (testResult) ->
    inspect_ testResult,
      result: inspectNetworkTestResult testResult
    render_ testResult, h2o.NetworkTestOutput, testResult

  extendProfile = (profile) ->
    render_ profile, h2o.ProfileOutput, profile

  extendFrames = (frames) ->
    render_ frames, h2o.FramesOutput, frames
    frames

  extendSplitFrameResult = (result) ->
    render_ result, h2o.SplitFrameOutput, result
    result

  extendMergeFramesResult = (result) ->
    render_ result, h2o.MergeFramesOutput, result
    result

  extendPartialDependence= (result) ->
    inspections = {}
    for data, i in result.partial_dependence_data
      origin = "getPartialDependence #{stringify result.destination_key}"
      inspections["plot#{i+1}"] = inspectTwoDimTable_ origin, "plot#{i+1}", data
    inspect_ result, inspections
    render_ result, h2o.PartialDependenceOutput, result
    result

#   inspectOutputsAcrossModels = (modelCategory, models) -> ->
#     switch modelCategory
#       when 'Binomial'
#       when 'Multinomial'
#       when 'Regression'

  getModelParameterValue = (type, value) ->
    switch type
      when 'Key<Frame>', 'Key<Model>'
        if value? then value.name else undefined
      when 'VecSpecifier'
        if value? then value.column_name else undefined
      else
        if value? then value else undefined

  inspectParametersAcrossModels = (models) -> ->
    leader = head models
    vectors = for parameter, i in leader.parameters
      data = for model in models
        getModelParameterValue parameter.type, model.parameters[i].actual_value
      switch parameter.type
        when 'enum', 'Frame', 'string'
          lightning.createFactor parameter.label, TString, data
        when 'byte', 'short', 'int', 'long', 'float', 'double'
          lightning.createVector parameter.label, TNumber, data
        when 'string[]', 'byte[]', 'short[]', 'int[]', 'long[]', 'float[]', 'double[]'
          lightning.createList parameter.label, data, (a) -> if a then a else undefined
        when 'boolean'
          lightning.createList parameter.label, data, (a) -> if a then 'true' else 'false'
        else
          lightning.createList parameter.label, data

    modelKeys = (model.model_id.name for model in models)

    lightning.createDataFrame 'parameters', vectors, (range models.length), null,
      description: "Parameters for models #{modelKeys.join ', '}"
      origin: "getModels #{stringify modelKeys}"

  inspectModelParameters = (model) -> ->
    parameters = model.parameters

    attrs = [
      'label'
      'type'
      'level'
      'actual_value'
      'default_value'
    ]

    vectors = for attr in attrs
      data = new Array parameters.length
      for parameter, i in parameters
        data[i] = if attr is 'actual_value'
          getModelParameterValue parameter.type, parameter[attr]
        else
          parameter[attr]
      lightning.createList attr, data

    lightning.createDataFrame 'parameters', vectors, (range parameters.length), null,
      description: "Parameters for model '#{model.model_id.name}'" #TODO frame model_id
      origin: "getModel #{stringify model.model_id.name}"

  extendJob = (job) ->
    render_ job, h2o.JobOutput, job

  extendJobs = (jobs) ->
    for job in jobs
      extendJob job
    render_ jobs, h2o.JobsOutput, jobs

  extendCancelJob = (cancellation) ->
    render_ cancellation, h2o.CancelJobOutput, cancellation

  extendDeletedKeys = (keys) ->
    render_ keys, h2o.DeleteObjectsOutput, keys

  inspectTwoDimTable_ = (origin, tableName, table) -> ->
    convertTableToFrame table, tableName,
      description: table.description or ''
      origin: origin

  inspectRawArray_ = (name, origin, description, array) -> ->
    lightning.createDataFrame name, [lightning.createList name, parseAndFormatArray array], (range array.length), null,
      description: ''
      origin: origin

  inspectObjectArray_ = (name, origin, description, array) -> ->
    lightning.createDataFrame name, [lightning.createList name, parseAndFormatObjectArray array], (range array.length), null,
      description: ''
      origin: origin

  inspectRawObject_ = (name, origin, description, obj) -> ->
    vectors = for k, v of obj
      lightning.createList k, [ if v is null then undefined else if isNumber v then format6fi v else v ]

    lightning.createDataFrame name, vectors, (range 1), null,
      description: ''
      origin: origin

  _schemaHacks =
    KMeansOutput:
      fields: 'names domains help'
    GBMOutput:
      fields: 'names domains help'
    GLMOutput:
      fields: 'names domains help'
    DRFOutput:
      fields: 'names domains help'
    DeepLearningModelOutput:
      fields: 'names domains help'
    NaiveBayesOutput:
      fields: 'names domains help pcond'
    PCAOutput:
      fields: 'names domains help'
    ModelMetricsBinomialGLM:
      fields: null
      transform: transformBinomialMetrics
    ModelMetricsBinomial:
      fields: null
      transform: transformBinomialMetrics
    ModelMetricsMultinomialGLM:
      fields: null
    ModelMetricsMultinomial:
      fields: null
    ModelMetricsRegressionGLM:
      fields: null
    ModelMetricsRegression:
      fields: null
    ModelMetricsClustering:
      fields: null
    ModelMetricsAutoEncoder:
      fields: null
    ConfusionMatrix:
      fields: null

  blacklistedAttributesBySchema = do ->
    dicts = {}
    for schema, attrs of _schemaHacks
      dicts[schema] = dict = __meta: yes
      if attrs.fields
        for field in words attrs.fields
          dict[field] = yes
    dicts

  schemaTransforms = do ->
    transforms = {}
    for schema, attrs of _schemaHacks
      if transform = attrs.transform
        transforms[schema] = transform
    transforms

  inspectObject = (inspections, name, origin, obj) ->
    schemaType = obj.__meta?.schema_type
    blacklistedAttributes = if schemaType
      if attrs = blacklistedAttributesBySchema[schemaType]
        attrs
      else
        {}
    else
      {}

    obj = transform obj if transform = schemaTransforms[schemaType]

    record = {}

    inspections[name] = inspectRawObject_ name, origin, name, record

    for k, v of obj when not blacklistedAttributes[k]
      if v is null
        record[k] = null
      else
        if v.__meta?.schema_type is 'TwoDimTable'
          inspections["#{name} - #{v.name}"] = inspectTwoDimTable_ origin, "#{name} - #{v.name}", v
        else
          if isArray v
            if k is 'cross_validation_models' or k is 'cross_validation_predictions' or (name is 'output' and (k is 'weights' or k is 'biases')) # megahack
              inspections[k] = inspectObjectArray_ k, origin, k, v
            else
              inspections[k] = inspectRawArray_ k, origin, k, v
          else if isObject v
            if meta = v.__meta
              if meta.schema_type is 'Key<Frame>'
                record[k] = "<a href='#' data-type='frame' data-key=#{stringify v.name}>#{escape v.name}</a>"
              else if meta.schema_type is 'Key<Model>'
                record[k] = "<a href='#' data-type='model' data-key=#{stringify v.name}>#{escape v.name}</a>"
              else if meta.schema_type is 'Frame'
                record[k] = "<a href='#' data-type='frame' data-key=#{stringify v.frame_id.name}>#{escape v.frame_id.name}</a>"
              else
                inspectObject inspections, "#{name} - #{k}", origin, v
            else
              console.log "WARNING: dropping [#{k}] from inspection:", v
          else
            record[k] = if isNumber v then format6fi v else v

    return

  extendModel = (model) ->

    extend = (model) ->
      inspections = {}
      inspections.parameters = inspectModelParameters model
      origin = "getModel #{stringify model.model_id.name}"
      inspectObject inspections, 'output', origin, model.output

      # Obviously, an array of 2d tables calls for a megahack.
      if model.__meta.schema_type is 'NaiveBayesModel'
        if isArray model.output.pcond
          for table in model.output.pcond
            tableName = "output - pcond - #{table.name}"
            inspections[tableName] = inspectTwoDimTable_ origin, tableName, table

      inspect_ model, inspections
      model

    refresh = (go) ->
      _.requestModel model.model_id.name, (error, model) ->
        if error then go error else go null, extend model

    extend model

    render_ model, h2o.ModelOutput, model, refresh

  extendGrid = (grid, opts) ->
    origin = "getGrid #{stringify grid.grid_id.name}"
    origin += ", #{stringify opts}" if opts
    inspections =
      summary: inspectTwoDimTable_ origin, "summary", grid.summary_table
      scoring_history: inspectTwoDimTable_ origin, "scoring_history", grid.scoring_history
    inspect_ grid, inspections
    render_ grid, h2o.GridOutput, grid

  extendGrids = (grids) ->
    render_ grids, h2o.GridsOutput, grids

  extendLeaderboard = (result) ->
    render_ result, h2o.LeaderboardOutput, result

  extendModels = (models) ->
    inspections = {}

    algos = uniq (model.algo for model in models)
    if algos.length is 1
      inspections.parameters = inspectParametersAcrossModels models

    # modelCategories = uniq (model.output.model_category for model in models)
    # TODO implement model comparision after 2d table cleanup for model metrics
    #if modelCategories.length is 1
    #  inspections.outputs = inspectOutputsAcrossModels (head modelCategories), models

    inspect_ models, inspections
    render_ models, h2o.ModelsOutput, models

  read = (value) -> if value is 'NaN' then null else value

  extendPredictions = (opts, predictions) ->
    render_ predictions, h2o.PredictsOutput, opts, predictions
    predictions

  extendPrediction = (result) ->
    modelKey = result.model.name
    frameKey = result.frame?.name
    prediction = head result.model_metrics
    predictionFrame = if result.predictions_frame is null then result.frame? else result.predictions_frame

    inspections = {}
    if prediction
      inspectObject inspections, 'Prediction', "getPrediction model: #{stringify modelKey}, frame: #{stringify frameKey}", prediction
    else
      prediction = {}
      inspectObject inspections, 'Prediction', "getPrediction model: #{stringify modelKey}, frame: #{stringify frameKey}", { prediction_frame: predictionFrame }

    inspect_ prediction, inspections
    render_ prediction, h2o.PredictOutput, modelKey, frameKey, predictionFrame, prediction

  inspectFrameColumns = (tableLabel, frameKey, frame, frameColumns) -> ->
    attrs = [
      'label'
      'type'
      'missing_count|Missing'
      'zero_count|Zeros'
      'positive_infinity_count|+Inf'
      'negative_infinity_count|-Inf'
      'min'
      'max'
      'mean'
      'sigma'
      'cardinality'
    ]

    toColumnSummaryLink = (label) ->
      "<a href='#' data-type='summary-link' data-key=#{stringify label}>#{escape label}</a>"

    toConversionLink = (value) ->
      [ type, label ] = value.split '\0'
      switch type
        when 'enum'
          "<a href='#' data-type='as-numeric-link' data-key=#{stringify label}>Convert to numeric</a>"
        when 'int', 'string'
          "<a href='#' data-type='as-factor-link' data-key=#{stringify label}>Convert to enum</a>"
        else
          undefined

    vectors = for attr in attrs
      [ name, title ] = attr.split '|'
      title = title ? name
      switch name
        when 'min'
          lightning.createVector title, TNumber, (head column.mins for column in frameColumns), format4f
        when 'max'
          lightning.createVector title, TNumber, (head column.maxs for column in frameColumns), format4f
        when 'cardinality'
          lightning.createVector title, TNumber, ((if column.type is 'enum' then column.domain_cardinality else undefined) for column in frameColumns)
        when 'label'
          lightning.createFactor title, TString, (column[name] for column in frameColumns), null, toColumnSummaryLink
        when 'type'
          lightning.createFactor title, TString, (column[name] for column in frameColumns)
        when 'mean', 'sigma'
          lightning.createVector title, TNumber, (column[name] for column in frameColumns), format4f
        else
          lightning.createVector title, TNumber, (column[name] for column in frameColumns)

    [ labelVector, typeVector ] = vectors
    actionsData = for i in [0 ... frameColumns.length]
      "#{typeVector.valueAt i}\0#{labelVector.valueAt i}"
    vectors.push lightning.createFactor 'Actions', TString, actionsData, null, toConversionLink

    lightning.createDataFrame tableLabel, vectors, (range frameColumns.length), null,
      description: "A list of #{tableLabel} in the H2O Frame."
      origin: "getFrameSummary #{stringify frameKey}"
      plot: "plot inspect '#{tableLabel}', getFrameSummary #{stringify frameKey}"

  inspectFrameData = (frameKey, frame) -> ->
    frameColumns = frame.columns

    vectors = for column in frameColumns
      #XXX format functions
      switch column.type
        when 'int', 'real'
          lightning.createVector column.label, TNumber, (parseNaNs column.data), format4f
        when 'enum'
          domain = column.domain
          lightning.createFactor column.label, TString, ((if index? then domain[index] else undefined) for index in column.data)
        when 'time'
          lightning.createVector column.label, TNumber, parseNaNs column.data
        when 'string', 'uuid'
          lightning.createList column.label, parseNulls column.string_data
        else
          lightning.createList column.label, parseNulls column.data

    vectors.unshift lightning.createVector 'Row', TNumber, (rowIndex + 1 for rowIndex in [frame.row_offset ... frame.row_count])

    lightning.createDataFrame 'data', vectors, (range frame.row_count - frame.row_offset), null,
      description: 'A partial list of rows in the H2O Frame.'
      origin: "getFrameData #{stringify frameKey}"

  extendFrameData = (frameKey, frame) ->
    inspections =
      data: inspectFrameData frameKey, frame

    origin = "getFrameData #{stringify frameKey}"
    inspect_ frame, inspections
    render_ frame, h2o.FrameDataOutput, frame

  extendFrame = (frameKey, frame) ->
    inspections =
      columns: inspectFrameColumns 'columns', frameKey, frame, frame.columns
      data: inspectFrameData frameKey, frame

    enumColumns = (column for column in frame.columns when column.type is 'enum')
    inspections.factors = inspectFrameColumns 'factors', frameKey, frame, enumColumns if enumColumns.length > 0

    origin = "getFrameSummary #{stringify frameKey}"
    inspections[frame.chunk_summary.name] = inspectTwoDimTable_ origin, frame.chunk_summary.name, frame.chunk_summary
    inspections[frame.distribution_summary.name] = inspectTwoDimTable_ origin, frame.distribution_summary.name, frame.distribution_summary
    inspect_ frame, inspections
    render_ frame, h2o.FrameOutput, frame

  extendFrameSummary = (frameKey, frame) ->
    inspections =
      columns: inspectFrameColumns 'columns', frameKey, frame, frame.columns

    enumColumns = (column for column in frame.columns when column.type is 'enum')
    inspections.factors = inspectFrameColumns 'factors', frameKey, frame, enumColumns if enumColumns.length > 0

    origin = "getFrameSummary #{stringify frameKey}"
    inspections[frame.chunk_summary.name] = inspectTwoDimTable_ origin, frame.chunk_summary.name, frame.chunk_summary
    inspections[frame.distribution_summary.name] = inspectTwoDimTable_ origin, frame.distribution_summary.name, frame.distribution_summary
    inspect_ frame, inspections
    render_ frame, h2o.FrameOutput, frame

  extendColumnSummary = (frameKey, frame, columnName) ->
    column = head frame.columns
    rowCount = frame.rows

    inspectPercentiles = ->
      vectors = [
        lightning.createVector 'percentile', TNumber, frame.default_percentiles
        lightning.createVector 'value', TNumber, column.percentiles
      ]

      lightning.createDataFrame 'percentiles', vectors, (range frame.default_percentiles.length), null,
        description: "Percentiles for column '#{column.label}' in frame '#{frameKey}'."
        origin: "getColumnSummary #{stringify frameKey}, #{stringify columnName}"

    inspectDistribution = ->
      minBinCount = 32
      { histogram_base:base, histogram_stride:stride, histogram_bins:bins } = column
      width = Math.ceil bins.length / minBinCount
      interval = stride * width

      rows = []
      if width > 0
        binCount = minBinCount + if bins.length % width > 0 then 1 else 0
        intervalData = new Array binCount
        widthData = new Array binCount
        countData = new Array binCount
        for i in [0 ... binCount]
          m = i * width
          n = m + width
          count = 0
          for binIndex in [m ... n] when binIndex < bins.length
            count += bins[binIndex]

          intervalData[i] = base + i * interval
          widthData[i] = interval
          countData[i] = count
      else
        binCount = bins.length
        intervalData = new Array binCount
        widthData = new Array binCount
        countData = new Array binCount
        for count, i in bins
          intervalData[i] = base + i * stride
          widthData[i] = stride
          countData[i] = count

      # Trim off empty bins from the end
      for i in [binCount - 1 .. 0]
        if countData[i] isnt 0
          binCount = i + 1
          intervalData = intervalData.slice 0, binCount
          widthData = widthData.slice 0, binCount
          countData = countData.slice 0, binCount
          break

      vectors = [
        lightning.createFactor 'interval', TString, intervalData
        lightning.createVector 'width', TNumber, widthData
        lightning.createVector 'count', TNumber, countData
      ]

      lightning.createDataFrame 'distribution', vectors, (range binCount), null,
        description: "Distribution for column '#{column.label}' in frame '#{frameKey}'."
        origin: "getColumnSummary #{stringify frameKey}, #{stringify columnName}"
        plot: "plot inspect 'distribution', getColumnSummary #{stringify frameKey}, #{stringify columnName}"

    inspectCharacteristics = ->
      { missing_count, zero_count, positive_infinity_count, negative_infinity_count } = column
      other = rowCount - missing_count - zero_count - positive_infinity_count - negative_infinity_count

      characteristicData = [ 'Missing', '-Inf', 'Zero', '+Inf', 'Other' ]
      countData = [ missing_count, negative_infinity_count, zero_count, positive_infinity_count, other ]
      percentData = for count in countData
        100 * count / rowCount

      vectors = [
        lightning.createFactor 'characteristic', TString, characteristicData
        lightning.createVector 'count', TNumber, countData
        lightning.createVector 'percent', TNumber, percentData
      ]

      lightning.createDataFrame 'characteristics', vectors, (range characteristicData.length), null,
        description: "Characteristics for column '#{column.label}' in frame '#{frameKey}'."
        origin: "getColumnSummary #{stringify frameKey}, #{stringify columnName}"
        plot: "plot inspect 'characteristics', getColumnSummary #{stringify frameKey}, #{stringify columnName}"

    inspectSummary = ->
      defaultPercentiles = frame.default_percentiles
      percentiles = column.percentiles

      mean = column.mean
      q1 = percentiles[defaultPercentiles.indexOf 0.25]
      q2 = percentiles[defaultPercentiles.indexOf 0.5]
      q3 = percentiles[defaultPercentiles.indexOf 0.75]
      outliers = uniq concat column.mins, column.maxs
      minimum = head column.mins
      maximum = head column.maxs

      vectors = [
        lightning.createFactor 'column', TString, [ columnName ]
        lightning.createVector 'mean', TNumber, [ mean ]
        lightning.createVector 'q1', TNumber, [ q1 ]
        lightning.createVector 'q2', TNumber, [ q2 ]
        lightning.createVector 'q3', TNumber, [ q3 ]
        lightning.createVector 'min', TNumber, [ minimum ]
        lightning.createVector 'max', TNumber, [ maximum ]
      ]

      lightning.createDataFrame 'summary', vectors, (range 1), null,
        description: "Summary for column '#{column.label}' in frame '#{frameKey}'."
        origin: "getColumnSummary #{stringify frameKey}, #{stringify columnName}"
        plot: "plot inspect 'summary', getColumnSummary #{stringify frameKey}, #{stringify columnName}"

    inspectDomain = ->
      levels = map column.histogram_bins, (count, index) -> count: count, index: index
      #TODO sort table in-place when sorting is implemented
      sortedLevels = sortBy levels, (level) -> -level.count

      [ labels, counts, percents ] = createArrays 3, sortedLevels.length

      for level, i in sortedLevels
        labels[i] = column.domain[level.index]
        counts[i] = level.count
        percents[i] = 100 * level.count / rowCount

      vectors = [
        lightning.createFactor 'label', TString, labels
        lightning.createVector 'count', TNumber, counts
        lightning.createVector 'percent', TNumber, percents
      ]

      lightning.createDataFrame 'domain', vectors, (range sortedLevels.length), null,
        description: "Domain for column '#{column.label}' in frame '#{frameKey}'."
        origin: "getColumnSummary #{stringify frameKey}, #{stringify columnName}"
        plot: "plot inspect 'domain', getColumnSummary #{stringify frameKey}, #{stringify columnName}"

    inspections =
      characteristics: inspectCharacteristics

    switch column.type
      when 'int', 'real'
        # Skip for columns with all NAs
        if column.histogram_bins.length
          inspections.distribution = inspectDistribution
        # Skip for columns with all NAs
        unless (some column.percentiles, (a) -> a is 'NaN')
          inspections.summary = inspectSummary
          inspections.percentiles = inspectPercentiles
      when 'enum'
        inspections.domain = inspectDomain

    inspect_ frame, inspections
    render_ frame, h2o.ColumnSummaryOutput, frameKey, frame, columnName

  requestFrame = (frameKey, go) ->
    _.requestFrameSlice frameKey, undefined, 0, 20, (error, frame) ->
      if error
        go error
      else
        go null, extendFrame frameKey, frame

  requestFrameData = (frameKey, searchTerm, offset, count, go) ->
    _.requestFrameSlice frameKey, searchTerm, offset, count, (error, frame) ->
      if error
        go error
      else
        go null, extendFrameData frameKey, frame

  requestFrameSummarySlice = (frameKey, searchTerm, offset, length, go) ->
    _.requestFrameSummarySlice frameKey, searchTerm, offset, length, (error, frame) ->
      if error
        go error
      else
        go null, extendFrameSummary frameKey, frame

  requestFrameSummary = (frameKey, go) ->
    _.requestFrameSummarySlice frameKey, undefined, 0, 20, (error, frame) ->
      if error
        go error
      else
        go null, extendFrameSummary frameKey, frame


  requestColumnSummary = (frameKey, columnName, go) ->
    _.requestColumnSummary frameKey, columnName, (error, frame) ->
      if error
        go error
      else
        go null, extendColumnSummary frameKey, frame, columnName

  requestFrames = (go) ->
    _.requestFrames (error, frames) ->
      if error
        go error
      else
        go null, extendFrames frames

  requestCreateFrame = (opts, go) ->
    _.requestCreateFrame opts, (error, result) ->
      if error
        go error
      else
        _.requestJob result.key.name, (error, job) ->
          if error
            go error
          else
            go null, extendJob job

  requestPartialDependence = (opts, go) ->
    _.requestPartialDependence opts, (error, result) ->
      if error
        go error
      else
        _.requestJob result.key.name, (error, job) ->
          if error
            go error
          else
            go null, extendJob job

  requestPartialDependenceData = (key, go) ->
    _.requestPartialDependenceData key, (error, result) ->
      if error
        go error
      else
        go null, extendPartialDependence result

  computeSplits = (ratios, keys) ->
    parts = []
    sum = 0

    for key, i in keys.slice(0, ratios.length)
      sum += ratio = ratios[i]
      parts.push
        key: key
        ratio: ratio

    parts.push
      key: keys[keys.length - 1]
      ratio: 1 - sum

    splits = []
    sum = 0
    for part in parts
      splits.push
        min: sum
        max: sum + part.ratio
        key: part.key

      sum += part.ratio

    splits

  requestBindFrames = (key, sourceKeys, go) ->
    _.requestExec "(assign #{key} (cbind #{sourceKeys.join ' '}))", (error, result) ->
      if error
        go error
      else
        go null, extendBindFrames key, result

  requestSplitFrame = (frameKey, splitRatios, splitKeys, seed, go) ->
    if splitRatios.length is splitKeys.length - 1
      splits = computeSplits splitRatios, splitKeys

      randomVecKey = lightning.createTempKey()

      statements = []

      statements.push "(tmp= #{randomVecKey} (h2o.runif #{frameKey} #{seed}))"

      for part, i in splits
        g = if i isnt 0 then "(> #{randomVecKey} #{part.min})" else null

        l = if i isnt splits.length - 1 then "(<= #{randomVecKey} #{part.max})" else null

        sliceExpr = if g and l
          "(& #{g} #{l})"
        else if l
          l
        else
          g

        statements.push "(assign #{part.key} (rows #{frameKey} #{sliceExpr}))"

      statements.push "(rm #{randomVecKey})"

      _.requestExec "(, #{statements.join ' '})", (error, result) ->
        if error
          go error
        else
          go null, extendSplitFrameResult
            keys: splitKeys
            ratios: splitRatios

    else
      go new FlowError 'The number of split ratios should be one less than the number of split keys'

  requestMergeFrames = (destinationKey, leftFrameKey, leftColumnIndex, includeAllLeftRows, rightFrameKey, rightColumnIndex, includeAllRightRows, go) ->
    lr = if includeAllLeftRows then 'TRUE' else 'FALSE'
    rr = if includeAllRightRows then 'TRUE' else 'FALSE'
    statement = "(assign #{destinationKey} (merge #{leftFrameKey} #{rightFrameKey} #{lr} #{rr} #{leftColumnIndex} #{rightColumnIndex} \"radix\"))"
    _.requestExec statement, (error, result) ->
      if error
        go error
      else
        go null, extendMergeFramesResult
          key: destinationKey

  createFrame = (opts) ->
    if opts
      _fork requestCreateFrame, opts
    else
      assist createFrame

  splitFrame = (frameKey, splitRatios, splitKeys, seed=-1) ->
    if frameKey and splitRatios and splitKeys
      _fork requestSplitFrame, frameKey, splitRatios, splitKeys, seed
    else
      assist splitFrame

  mergeFrames = (destinationKey, leftFrameKey, leftColumnIndex, includeAllLeftRows, rightFrameKey, rightColumnIndex, includeAllRightRows) ->
    if destinationKey and leftFrameKey and rightFrameKey
      _fork requestMergeFrames, destinationKey, leftFrameKey, leftColumnIndex, includeAllLeftRows, rightFrameKey, rightColumnIndex, includeAllRightRows
    else
      assist mergeFrames

  # define the function that is called when
  # the Partial Dependence plot input form
  # is submitted
  buildPartialDependence = (opts) ->
    if opts
      _fork requestPartialDependence, opts
    else
      # specify function to call if user
      # provides malformed input
      assist buildPartialDependence

  getPartialDependence = (destinationKey) ->
    if destinationKey
      _fork requestPartialDependenceData, destinationKey
    else
      assist getPartialDependence

  getFrames = ->
    _fork requestFrames

  getFrame = (frameKey) ->
    switch typeOf frameKey
      when 'String'
        _fork requestFrame, frameKey
      else
        assist getFrame

  bindFrames = (key, sourceKeys) ->
    _fork requestBindFrames, key, sourceKeys

  getFrameSummary = (frameKey) ->
    switch typeOf frameKey
      when 'String'
        _fork requestFrameSummary, frameKey
      else
        assist getFrameSummary

  getFrameData = (frameKey) ->
    switch typeOf frameKey
      when 'String'
        _fork requestFrameData, frameKey, undefined, 0, 20
      else
        assist getFrameSummary

  requestDeleteFrame = (frameKey, go) ->
    _.requestDeleteFrame frameKey, (error, result) ->
      if error then go error else go null, extendDeletedKeys [ frameKey ]

  deleteFrame = (frameKey) ->
    if frameKey
      _fork requestDeleteFrame, frameKey
    else
      assist deleteFrame

  extendExportFrame = (result) ->
    render_ result, h2o.ExportFrameOutput, result

  extendBindFrames = (key, result) ->
    render_ result, h2o.BindFramesOutput, key, result

  requestExportFrame = (frameKey, path, opts, go) ->
    _.requestExportFrame frameKey, path, (if opts.overwrite then yes else no), (error, result) ->
      if error
        go error
      else
        _.requestJob result.job.key.name, (error, job) ->
          if error
            go error
          else
            go null, extendJob job

  exportFrame = (frameKey, path, opts={}) ->
    if frameKey and path
      _fork requestExportFrame, frameKey, path, opts
    else
      assist exportFrame, frameKey, path, opts

  requestDeleteFrames = (frameKeys, go) ->
    futures = map frameKeys, (frameKey) ->
      _fork _.requestDeleteFrame, frameKey
    async.join futures, (error, results) ->
      if error
        go error
      else
        go null, extendDeletedKeys frameKeys

  deleteFrames = (frameKeys) ->
    switch frameKeys.length
      when 0
        assist deleteFrames
      when 1
        deleteFrame head frameKeys
      else
        _fork requestDeleteFrames, frameKeys

  getColumnSummary = (frameKey, columnName) ->
    _fork requestColumnSummary, frameKey, columnName

  requestModels = (go) ->
    _.requestModels (error, models) ->
      if error then go error else go null, extendModels models

  requestModelsByKeys = (modelKeys, go) ->
    futures = map modelKeys, (key) ->
      _fork _.requestModel, key
    async.join futures, (error, models) ->
      if error then go error else go null, extendModels models

  getModels = (modelKeys) ->
    if isArray modelKeys
      if modelKeys.length
        _fork requestModelsByKeys, modelKeys
      else
        _fork requestModels
    else
      _fork requestModels

  requestGrids = (go) ->
    _.requestGrids (error, grids) ->
      if error then go error else go null, extendGrids grids

  getGrids = ->
    _fork requestGrids

  requestLeaderboard = (key, go) ->
    _.requestLeaderboard key, (error, leaderboard) ->
      if error then go error else go null, extendLeaderboard leaderboard

  getLeaderboard = (key) ->
    _fork requestLeaderboard, key

  requestModel = (modelKey, go) ->
    _.requestModel modelKey, (error, model) ->
      if error then go error else go null, extendModel model

  getModel = (modelKey) ->
    switch typeOf modelKey
      when 'String'
        _fork requestModel, modelKey
      else
        assist getModel

  requestGrid = (gridKey, opts, go) ->
    _.requestGrid gridKey, opts, (error, grid) ->
      if error then go error else go null, extendGrid grid, opts

  getGrid = (gridKey, opts) ->
    switch typeOf gridKey
      when 'String'
        _fork requestGrid, gridKey, opts
      else
        assist getGrid

  findColumnIndexByColumnLabel = (frame, columnLabel) ->
    for column, i in frame.columns when column.label is columnLabel
      return i
    throw new FlowError "Column [#{columnLabel}] not found in frame"

  findColumnIndicesByColumnLabels = (frame, columnLabels) ->
    for columnLabel in columnLabels
      findColumnIndexByColumnLabel frame, columnLabel


  requestImputeColumn = (opts, go) ->
    { frame, column, method, combineMethod, groupByColumns } = opts
    combineMethod = combineMethod ? 'interpolate'
    _.requestFrameSummaryWithoutData frame, (error, result) ->
      if error
        go error
      else
        try
          columnIndex = findColumnIndexByColumnLabel result, column
        catch columnKeyError
          return go columnKeyError

        if groupByColumns and groupByColumns.length
          try
            groupByColumnIndices = findColumnIndicesByColumnLabels result, groupByColumns
          catch columnIndicesError
            return go columnIndicesError
        else
          groupByColumnIndices = null

        groupByArg = if groupByColumnIndices
          "[#{groupByColumnIndices.join ' '}]"
        else
          "[]"

        _.requestExec "(h2o.impute #{frame} #{columnIndex} #{JSON.stringify method} #{JSON.stringify combineMethod} #{groupByArg} _ _)", (error, result) ->
          if error
            go error
          else
            requestColumnSummary frame, column, go

  requestChangeColumnType = (opts, go) ->
    { frame, column, type } = opts

    method = if type is 'enum' then 'as.factor' else 'as.numeric'

    _.requestFrameSummaryWithoutData frame, (error, result) ->
        try
          columnIndex = findColumnIndexByColumnLabel result, column
        catch columnKeyError
          return go columnKeyError

        _.requestExec "(assign #{frame} (:= #{frame} (#{method} (cols #{frame} #{columnIndex})) #{columnIndex} [0:#{result.rows}]))", (error, result) ->
          if error
            go error
          else
            requestColumnSummary frame, column, go

  imputeColumn = (opts) ->
    if opts and opts.frame and opts.column and opts.method
      _fork requestImputeColumn, opts
    else
      assist imputeColumn, opts

  changeColumnType = (opts) ->
    if opts and opts.frame and opts.column and opts.type
      _fork requestChangeColumnType, opts
    else
      assist changeColumnType, opts

  requestDeleteModel = (modelKey, go) ->
    _.requestDeleteModel modelKey, (error, result) ->
      if error then go error else go null, extendDeletedKeys [ modelKey ]

  deleteModel = (modelKey) ->
    if modelKey
      _fork requestDeleteModel, modelKey
    else
      assist deleteModel

  extendImportModel = (result) ->
    render_ result, h2o.ImportModelOutput, result

  requestImportModel = (path, opts, go) ->
    _.requestImportModel path, (if opts.overwrite then yes else no), (error, result) ->
      if error then go error else go null, extendImportModel result

  importModel = (path, opts) ->
    if path and path.length
      _fork requestImportModel, path, opts
    else
      assist importModel, path, opts

  extendExportModel = (result) ->
    render_ result, h2o.ExportModelOutput, result

  requestExportModel = (modelKey, path, opts, go) ->
    _.requestExportModel opts.format, modelKey, path, (if opts.overwrite then yes else no), (error, result) ->
      if error then go error else go null, extendExportModel result

  exportModel = (modelKey, path, opts) ->
    if modelKey and path
      _fork requestExportModel, modelKey, path, opts
    else
      assist exportModel, modelKey, path, opts

  requestDeleteModels = (modelKeys, go) ->
    futures = map modelKeys, (modelKey) ->
      _fork _.requestDeleteModel, modelKey
    async.join futures, (error, results) ->
      if error
        go error
      else
        go null, extendDeletedKeys modelKeys

  deleteModels = (modelKeys) ->
    switch modelKeys.length
      when 0
        assist deleteModels
      when 1
        deleteModel head modelKeys
      else
        _fork requestDeleteModels, modelKeys

  requestJob = (key, go) ->
    _.requestJob key, (error, job) ->
      if error
        go error
      else
        go null, extendJob job

  requestJobs = (go) ->
    _.requestJobs (error, jobs) ->
      if error
        go error
      else
        go null, extendJobs jobs

  getJobs = ->
    _fork requestJobs

  getJob = (arg) ->
    switch typeOf arg
      when 'String'
        _fork requestJob, arg
      when 'Object'
        if arg.key?
          getJob arg.key
        else
          assist getJob
      else
        assist getJob

  requestCancelJob = (key, go) ->
    _.requestCancelJob key, (error) ->
      if error
        go error
      else
        go null, extendCancelJob {}

  cancelJob = (arg) ->
    switch typeOf arg
      when 'String'
        _fork requestCancelJob, arg
      else
        assist cancelJob

  extendImportResults = (importResults) ->
    render_ importResults, h2o.ImportFilesOutput, importResults

  requestImportFiles = (paths, go) ->
    _.requestImportFiles paths, (error, importResults) ->
      if error
        go error
      else
        go null, extendImportResults importResults

  importFiles = (paths) ->
    switch typeOf paths
      when 'Array'
        _fork requestImportFiles, paths
      else
        assist importFiles

  extendImportSqlResults = (importResults) ->
    render_ importResults, h2o.ImportSqlTableOutput, importResults

  requestImportSqlTable = (arg, go) ->
    _.requestImportSqlTable arg, (error, importResults) ->
      if error
        go error
      else
        go null, extendImportSqlResults importResults

  importSqlTable = (arg) ->
    switch typeOf arg
      when 'Object'
        _fork requestImportSqlTable, arg
      else
        assist importSqlTable

  importBqTable = ->
    assist importBqTable

  extendParseSetupResults = (args, parseSetupResults) ->
    render_ parseSetupResults, h2o.SetupParseOutput, args, parseSetupResults

  requestImportAndParseSetup = (paths, go) ->
    _.requestImportFiles paths, (error, importResults) ->
      if error
        go error
      else
        sourceKeys = flatten compact map importResults, (result) -> result.destination_frames
        _.requestParseSetup sourceKeys, (error, parseSetupResults) ->
          if error
            go error
          else
            go null, extendParseSetupResults { paths: paths }, parseSetupResults

  requestParseSetup = (sourceKeys, go) ->
    _.requestParseSetup sourceKeys, (error, parseSetupResults) ->
      if error
        go error
      else
        go null, extendParseSetupResults { source_frames: sourceKeys }, parseSetupResults

  setupParse = (args) ->
    if args.paths and isArray args.paths
      _fork requestImportAndParseSetup, args.paths
    else if args.source_frames and isArray args.source_frames
      _fork requestParseSetup, args.source_frames
    else
      assist setupParse

  extendParseResult = (parseResult) ->
    render_ parseResult, h2o.JobOutput, parseResult.job

  requestImportAndParseFiles = (paths, destinationKey, parseType, separator, columnCount, useSingleQuotes, columnNames, columnTypes, deleteOnDone, checkHeader, chunkSize, go) ->
    _.requestImportFiles paths, (error, importResults) ->
      if error
        go error
      else
        sourceKeys = flatten compact map importResults, (result) -> result.destination_frames
        _.requestParseFiles sourceKeys, destinationKey, parseType, separator, columnCount, useSingleQuotes, columnNames, columnTypes, deleteOnDone, checkHeader, chunkSize, (error, parseResult) ->
          if error
            go error
          else
            go null, extendParseResult parseResult

  requestParseFiles = (sourceKeys, destinationKey, parseType, separator, columnCount, useSingleQuotes, columnNames, columnTypes, deleteOnDone, checkHeader, chunkSize, go) ->
    _.requestParseFiles sourceKeys, destinationKey, parseType, separator, columnCount, useSingleQuotes, columnNames, columnTypes, deleteOnDone, checkHeader, chunkSize, (error, parseResult) ->
      if error
        go error
      else
        go null, extendParseResult parseResult

  parseFiles = (opts) -> #XXX review args
    #XXX validation
    destinationKey = opts.destination_frame
    parseType = opts.parse_type
    separator = opts.separator
    columnCount = opts.number_columns
    useSingleQuotes = opts.single_quotes
    columnNames = opts.column_names
    columnTypes = opts.column_types
    deleteOnDone = opts.delete_on_done
    checkHeader = opts.check_header
    chunkSize = opts.chunk_size

    if opts.paths
      _fork requestImportAndParseFiles, opts.paths, destinationKey, parseType, separator, columnCount, useSingleQuotes, columnNames, columnTypes, deleteOnDone, checkHeader, chunkSize
    else
      _fork requestParseFiles, opts.source_frames, destinationKey, parseType, separator, columnCount, useSingleQuotes, columnNames, columnTypes, deleteOnDone, checkHeader, chunkSize

  requestModelBuild = (algo, opts, go) ->
    _.requestModelBuild algo, opts, (error, result) ->
      if error
        go error
      else
        if result.error_count > 0
          messages = (validation.message for validation in result.messages)
          go new FlowError "Model build failure: #{messages.join '; '}"
        else
          go null, extendJob result.job


  requestAutoModelBuild = (opts, go) ->
    # TODO loss
    params =
      input_spec:
        training_frame: opts.training_frame
        validation_frame: opts.validation_frame
        response_column: opts.response_column
        fold_column: opts.fold_column
        weights_column: opts.weights_column
        ignored_columns: opts.ignored_columns
        leaderboard_frame: opts.leaderboard_frame
        sort_metric: opts.sort_metric
      build_models:
        exclude_algos: opts.exclude_algos
      build_control:
        nfolds: opts.nfolds
        keep_cross_validation_predictions: opts.keep_cross_validation_predictions
        keep_cross_validation_models: opts.keep_cross_validation_models
        keep_cross_validation_fold_assignment: opts.keep_cross_validation_fold_assignment
        balance_classes: opts.balance_classes
        class_sampling_factors: opts.class_sampling_factors
        max_after_balance_size: opts.max_after_balance_size
        export_checkpoints_dir: opts.export_checkpoints_dir
        stopping_criteria:
          seed: opts.seed
          max_models: opts.max_models
          max_runtime_secs: opts.max_runtime_secs
          stopping_rounds: opts.stopping_rounds
          stopping_tolerance: opts.stopping_tolerance
          # TODO Enums currently fail with:
          # ERROR MESSAGE: setField can't yet convert a: class java.lang.String to a: class hex.ScoreKeeper$StoppingMetric
          # stopping_metric: opts.stopping_metric
    if opts.project_name != ''
      params.build_control.project_name = opts.project_name

    _.requestAutoModelBuild params, (error, result) ->
      if error
        go error
      else
        go null, extendJob result.job

  runAutoML = (opts) ->
    if opts and keys(opts).length > 1
      _fork requestAutoModelBuild, opts
    else
      assist runAutoML, opts

  buildModel = (algo, opts) ->
    if algo and opts and keys(opts).length > 1
      _fork requestModelBuild, algo, opts
    else
      assist buildModel, algo, opts

  unwrapPrediction = (go) ->
    (error, result) ->
      if error
        go error
      else
        go null, extendPrediction result

  requestPredict = (destinationKey, modelKey, frameKey, options, go) ->
    _.requestPredict destinationKey, modelKey, frameKey, options, unwrapPrediction go

  requestPredicts = (opts, go) ->
    futures = map opts, (opt) ->
      { model: modelKey, frame: frameKey, options: options } = opt
      _fork _.requestPredict, null, modelKey, frameKey, options or {}

    async.join futures, (error, predictions) ->
      if error
        go error
      else
        go null, extendPredictions opts, predictions

  predict = (opts={}) ->
    { predictions_frame, model, models, frame, frames, reconstruction_error, deep_features_hidden_layer, leaf_node_assignment, exemplar_index } = opts
    if models or frames
      unless models
        if model
          models = [ model ]
      unless frames
        if frame
          frames = [ frame ]

      if frames and models
        combos = []
        for model in models
          for frame in frames
            combos.push model: model, frame: frame

        _fork requestPredicts, combos
      else
        assist predict, predictions_frame: predictions_frame, models: models, frames: frames
    else
      if model and frame
        _fork requestPredict, predictions_frame, model, frame,
          reconstruction_error: reconstruction_error
          deep_features_hidden_layer: deep_features_hidden_layer
          leaf_node_assignment: leaf_node_assignment
      else if model and exemplar_index isnt undefined
        _fork requestPredict, predictions_frame, model, null,
          exemplar_index: exemplar_index
      else
        assist predict, predictions_frame: predictions_frame, model: model, frame: frame

  requestPrediction = (modelKey, frameKey, go) ->
    _.requestPrediction modelKey, frameKey, unwrapPrediction go

  requestPredictions = (opts, go) ->
    if isArray opts
      futures = map opts, (opt) ->
        { model: modelKey, frame: frameKey } = opt
        _fork _.requestPredictions, modelKey, frameKey
      async.join futures, (error, predictions) ->
        if error
          go error
        else
          # De-dupe predictions
          uniquePredictions = values keyBy (flatten predictions, yes), (prediction) -> prediction.model.name + prediction.frame.name
          go null, extendPredictions opts, uniquePredictions
    else
      { model: modelKey, frame: frameKey } = opts
      _.requestPredictions modelKey, frameKey, (error, predictions) ->
        if error
          go error
        else
          go null, extendPredictions opts, predictions

  getPrediction = (opts={}) ->
    { predictions_frame, model, frame } = opts
    if model and frame
      _fork requestPrediction, model, frame
    else
      assist getPrediction, predictions_frame: predictions_frame, model: model, frame: frame

  getPredictions = (opts={}) ->
    _fork requestPredictions, opts

  requestCloud = (go) ->
    _.requestCloud (error, cloud) ->
      if error
        go error
      else
        go null, extendCloud cloud

  getCloud = ->
    _fork requestCloud

  requestTimeline = (go) ->
    _.requestTimeline (error, timeline) ->
      if error
        go error
      else
        go null, extendTimeline timeline

  getTimeline = ->
    _fork requestTimeline

  requestStackTrace = (go) ->
    _.requestStackTrace (error, stackTrace) ->
      if error
        go error
      else
        go null, extendStackTrace stackTrace

  getStackTrace = ->
    _fork requestStackTrace

  requestLogFile = (nodeIpPort, fileType, go) ->
    _.requestCloud (error, cloud) ->
      if error
        go error
      else
        _.requestLogFile nodeIpPort, fileType, (error, logFile) ->
          if error
            go error
          else
            go null, extendLogFile cloud, nodeIpPort, fileType, logFile

  getLogFile = (nodeIpPort="self", fileType='info') ->
    _fork requestLogFile, nodeIpPort, fileType

  requestNetworkTest = (go) ->
    _.requestNetworkTest (error, result) ->
      if error
        go error
      else
        go null, extendNetworkTest result

  testNetwork = ->
    _fork requestNetworkTest

  requestRemoveAll = (go) ->
    _.requestRemoveAll (error, result) ->
      if error
        go error
      else
        go null, extendDeletedKeys []

  deleteAll = ->
    _fork requestRemoveAll

  extendRDDs = (rdds) ->
    render_ rdds, h2o.RDDsOutput, rdds
    rdds

  requestRDDs = (go) ->
    _.requestRDDs (error, result) ->
      if error
        go error
      else
        go null, extendRDDs result.rdds

  getRDDs = ->
    _fork requestRDDs

  extendDataFrames = (dataframes) ->
    render_ dataframes, h2o.DataFramesOutput, dataframes
    dataframes

  requestDataFrames = (go) ->
    _.requestDataFrames (error, result) ->
      if error
        go error
      else
        go null, extendDataFrames result.dataframes

  getDataFrames = ->
    _fork requestDataFrames

  extendAsH2OFrame = (result) ->
    render_ result, h2o.H2OFrameOutput, result
    result

  requestAsH2OFrameFromRDD = (rdd_id, name, go) ->
    _.requestAsH2OFrameFromRDD rdd_id,name, (error, h2oframe_id) ->
      if error
        go error
      else
        go null, extendAsH2OFrame h2oframe_id

  asH2OFrameFromRDD = (rdd_id, name=undefined) ->
    _fork requestAsH2OFrameFromRDD, rdd_id, name

  requestAsH2OFrameFromDF = (df_id, name, go) ->
    _.requestAsH2OFrameFromDF df_id, name, (error, result) ->
      if error
        go error
      else
        go null, extendAsH2OFrame result

  asH2OFrameFromDF = (df_id, name=undefined) ->
    _fork requestAsH2OFrameFromDF, df_id, name


  extendAsDataFrame = (result) ->
    render_ result, h2o.DataFrameOutput, result
    result

  requestAsDataFrame = (hf_id, name, go) ->
    _.requestAsDataFrame hf_id, name, (error, result) ->
      if error
        go error
      else
        go null, extendAsDataFrame result

  asDataFrame = (hf_id, name=undefined) ->
    _fork requestAsDataFrame, hf_id, name

  getScalaCodeExecutionResult = (key) ->
    switch typeOf key
      when 'String'
        _fork requestScalaCodeExecutionResult, key
      else
        assist getScalaCodeExecutionResult

  requestScalaCodeExecutionResult = (key, go) ->
    _.requestScalaCodeExecutionResult key, (error, result) ->
      if error
        go error
      else
        go null, extendScalaSyncCode result

  requestScalaCode = (session_id, async, code, go) ->
    _.requestScalaCode session_id, code,  (error, result) ->
      if error
        go error
      else
        if async
            go null, extendScalaAsyncCode result
        else
            go null, extendScalaSyncCode result


  extendScalaSyncCode = (result) ->
    render_ result, h2o.ScalaCodeOutput, result
    result

  extendScalaAsyncCode = (result) ->
    render_ result, h2o.JobOutput, result.job
    result

  runScalaCode = (session_id, async, code) ->
    _fork requestScalaCode, session_id, async, code

  requestScalaIntp = (go) ->
    _.requestScalaIntp (error, result) ->
      if error
        go error
      else
        go null, extendScalaIntp result

  extendScalaIntp = (result) ->
    render_ result, h2o.ScalaIntpOutput, result
    result

  getScalaIntp = ->
    _fork requestScalaIntp

  requestProfile = (depth, go) ->
    _.requestProfile depth, (error, profile) ->
      if error
        go error
      else
        go null, extendProfile profile

  getProfile = (opts) ->
    opts = depth: 10 unless opts
    _fork requestProfile, opts.depth

  loadScript = (path, go) ->
    onDone = (script, status) -> go null, script:script, status:status
    onFail = (jqxhr, settings, error) -> go error #TODO use framework error
    $.getScript path
      .done onDone
      .fail onFail

  dumpFuture = (result, go) ->
    result ?= {}
    console.debug result
    go null, render_ result, objectBrowser, 'dump', result

  dump = (f) ->
    if f?.isFuture
      _fork dumpFuture, f
    else
      async.async -> f

  assist = (func, args...) ->
    if func is undefined
      _fork proceed, h2o.Assist, [ _assistance ]
    else
      switch func
        when importFiles
          _fork proceed, h2o.ImportFilesInput, []
        when importSqlTable
          _fork proceed, h2o.ImportSqlTableInput, args
        when importBqTable
          _fork proceed, h2o.ImportBqTableInput, args
        when buildModel
          _fork proceed, h2o.ModelInput, args
        when runAutoML
          _fork proceed, h2o.AutoModelInput, args
        when predict, getPrediction
          _fork proceed, h2o.PredictInput, args
        when createFrame
          _fork proceed, h2o.CreateFrameInput, args
        when splitFrame
          _fork proceed, h2o.SplitFrameInput, args
        when mergeFrames
          _fork proceed, h2o.MergeFramesInput, args
        when buildPartialDependence
          _fork proceed, h2o.PartialDependenceInput, args
        when exportFrame
          _fork proceed, h2o.ExportFrameInput, args
        when imputeColumn
          _fork proceed, h2o.ImputeInput, args
        when importModel
          _fork proceed, h2o.ImportModelInput, args
        when exportModel
          _fork proceed, h2o.ExportModelInput, args
        else
          _fork proceed, h2o.NoAssist, []

  link _.ready, ->
    link _.ls, ls
    link _.inspect, inspect
    link _.plot, (plot) -> plot lightning
    link _.grid, (frame) ->
      lightning(
        lightning.select()
        lightning.from frame
      )
    link _.enumerate, (frame) ->
      lightning(
        lightning.select 0
        lightning.from frame
      )
    link _.requestFrameDataE, requestFrameData
    link _.requestFrameSummarySliceE, requestFrameSummarySlice

  initAssistanceSparklingWater = ->
    _assistance.getRDDs =
      description: 'Get a list of Spark\'s RDDs'
      icon: 'table'
    _assistance.getDataFrames =
      description: 'Get a list of Spark\'s data frames'
      icon: 'table'

  link _.initialized, ->
    if _.onSparklingWater
            initAssistanceSparklingWater()

  routines =
    # fork/join
    fork: _fork
    join: _join
    call: _call
    apply: _apply
    isFuture: _isFuture
    #
    # Dataflow
    signal: signal
    signals: signals
    isSignal: isSignal
    act: act
    react: react
    lift: lift
    merge: merge
    #
    # Generic
    dump: dump
    inspect: inspect
    plot: plot
    grid: grid
    get: _get
    #
    # Meta
    assist: assist
    #
    # GUI
    gui: gui
    #
    # Util
    loadScript: loadScript
    #
    # H2O
    getJobs: getJobs
    getJob: getJob
    cancelJob: cancelJob
    importFiles: importFiles
    importSqlTable: importSqlTable
    importBqTable: importBqTable
    setupParse: setupParse
    parseFiles: parseFiles
    createFrame: createFrame
    splitFrame: splitFrame
    mergeFrames: mergeFrames
    buildPartialDependence: buildPartialDependence
    getPartialDependence: getPartialDependence
    getFrames: getFrames
    getFrame: getFrame
    bindFrames: bindFrames
    getFrameSummary: getFrameSummary
    getFrameData: getFrameData
    deleteFrames: deleteFrames
    deleteFrame: deleteFrame
    exportFrame: exportFrame
    getColumnSummary: getColumnSummary
    changeColumnType: changeColumnType
    imputeColumn: imputeColumn
    buildModel: buildModel
    runAutoML: runAutoML
    getGrids: getGrids
    getLeaderboard: getLeaderboard
    getModels: getModels
    getModel: getModel
    getGrid: getGrid
    deleteModels: deleteModels
    deleteModel: deleteModel
    importModel: importModel
    exportModel: exportModel
    predict: predict
    getPrediction: getPrediction
    getPredictions: getPredictions
    getCloud: getCloud
    getTimeline: getTimeline
    getProfile: getProfile
    getStackTrace: getStackTrace
    getLogFile: getLogFile
    testNetwork: testNetwork
    deleteAll: deleteAll

  if _.onSparklingWater
    routinesOnSw =
      getDataFrames: getDataFrames
      getRDDs: getRDDs
      getScalaIntp: getScalaIntp
      runScalaCode: runScalaCode
      asH2OFrameFromRDD: asH2OFrameFromRDD
      asH2OFrameFromDF: asH2OFrameFromDF
      asDataFrame: asDataFrame
      getScalaCodeExecutionResult: getScalaCodeExecutionResult
    for attrname of routinesOnSw
      routines[attrname] = routinesOnSw[attrname]
  routines
