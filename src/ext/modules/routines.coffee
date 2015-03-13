lightning = if window?.plot? then window.plot else {}

if lightning.settings
  lightning.settings.axisLabelFont = '11px "Source Code Pro", monospace'
  lightning.settings.axisTitleFont = 'bold 11px "Source Code Pro", monospace'

createVector = lightning.createVector
createFactor = lightning.createFactor
createList = lightning.createList
createDataframe = lightning.createFrame

_assistance =
  importFiles:
    description: 'Import file(s) into H<sub>2</sub>O'
    icon: 'files-o'
  getFrames:
    description: 'Get a list of frames in H<sub>2</sub>O'
    icon: 'database'
  splitFrame:
    description: 'Split a frame into two or more frames'
    icon: 'scissors'
  getModels:
    description: 'Get a list of models in H<sub>2</sub>O'
    icon: 'cubes'
  getPredictions: 
    description: 'Get a list of predictions in H<sub>2</sub>O'
    icon: 'bolt'
  getJobs:
    description: 'Get a list of jobs running in H<sub>2</sub>O'
    icon: 'tasks'
  buildModel:
    description: 'Build a model'
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
    when 'byte', 'short', 'int', 'long'
      createVector column.name, TNumber, parseNumbers data
    when 'float', 'double'
      createVector column.name, TNumber, parseNumbers data
    when 'string'
      createFactor column.name, TString, data
    else
      createList column.name, data

convertTableToFrame = (table, metadata) ->
  #TODO handle format strings and description
  vectors = for column, i in table.columns
    convertColumnToVector column, table.data[i]
  createDataframe table.name, vectors, (sequence table.rowcount), null, metadata

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
  [[tn, fp], [fn, tp]] = cm
  [ table, tbody, tr, td ] = Flow.HTML.template 'table.flow-matrix', 'tbody', 'tr', 'td'

  table [ 
    tbody [
      tr [
        td tn
        td fp
      ]
      tr [
        td fn
        td tp
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

H2O.Routines = (_) ->
  #TODO move these into Flow.Async
  _fork = (f, args...) -> Flow.Async.fork f, args
  _join = (args..., go) -> Flow.Async.join args, Flow.Async.applicate go
  _call = (go, args...) -> Flow.Async.join args, Flow.Async.applicate go
  _apply = (go, args) -> Flow.Async.join args, go
  _isFuture = Flow.Async.isFuture
  _async = Flow.Async.async
  _get = Flow.Async.get

  #XXX obsolete
  proceed = (func, args, go) ->
    go null, render_ {}, -> apply func, null, [_].concat args or []

  proceed = (func, args, go) ->
    go null, apply render_, null, [ {}, func, ].concat args or []

  extendGuiForm = (form) ->
    render_ form, Flow.Form, form

  createGui = (controls, go) ->
    go null, extendGuiForm signals controls or []

  gui = (controls) ->
    _fork createGui, controls

  gui[name] = f for name, f of Flow.Gui

  flow_ = (raw) ->
    raw._flow_ or raw._flow_ = _cache_: {}

  #XXX obsolete
  render_ = (raw, render) ->
    (flow_ raw).render = render
    raw

  render_ = (raw, render, args...) ->
    (flow_ raw).render = (go) ->
      # Prepend current context (_) and a continuation (go)
      apply render, null, [_, go].concat args
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
        render_ inspections, H2O.InspectsOutput, inspections
        inspections
      else
        {}

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
    render_ inspection, H2O.InspectOutput, inspection
    inspection

  _plot = (render, go) ->
    render (error, vis) ->
      if error
        go new Flow.Error 'Error rendering vis.', error
      else
        go null, vis

  extendPlot = (vis) ->
    render_ vis, H2O.PlotOutput, vis.element

  createPlot = (f, go) ->
    _plot (f lightning), (error, vis) ->
      if error
        go error
      else
        go null, extendPlot vis

  plot = (f) ->
    if _isFuture f
      _fork proceed, H2O.PlotInput, f
    else if isFunction f
      _fork createPlot, f
    else
      assist plot

  grid = (f) ->
    plot (g) -> g(
      g.select()
      g.from f
    )

  extendCloud = (cloud) ->
    render_ cloud, H2O.CloudOutput, cloud

  extendTimeline = (timeline) ->
    render_ timeline, H2O.TimelineOutput, timeline

  extendStackTrace = (stackTrace) ->
    render_ stackTrace, H2O.StackTraceOutput, stackTrace

  extendLogFile = (cloud, nodeIndex, fileType, logFile) ->
    render_ logFile, H2O.LogFileOutput, cloud, nodeIndex, fileType, logFile

  inspectNetworkTestResult = (testResult) -> ->
    convertTableToFrame testResult.table,
      description: testResult.table.name
      origin: "testNetwork"

  extendNetworkTest = (testResult) ->
    inspect_ testResult,
      result: inspectNetworkTestResult testResult
    render_ testResult, H2O.NetworkTestOutput, testResult

  extendProfile = (profile) ->
    render_ profile, H2O.ProfileOutput, profile

  extendFrames = (frames) ->
    render_ frames, H2O.FramesOutput, frames
    frames

  extendSplitFrameResult = (result) ->
    render_ result, H2O.SplitFrameOutput, result
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
          createFactor parameter.label, TString, data
        when 'byte', 'short', 'int', 'long', 'float', 'double'
          createVector parameter.label, TNumber, data
        when 'string[]', 'byte[]', 'short[]', 'int[]', 'long[]', 'float[]', 'double[]'
          createList parameter.label, data, (a) -> if a then a else undefined
        when 'boolean'
          createList parameter.label, data, (a) -> if a then 'true' else 'false'
        else
          createList parameter.label, data

    modelKeys = (model.key.name for model in models)

    createDataframe 'parameters', vectors, (sequence models.length), null,
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
      createList attr, data

    createDataframe 'parameters', vectors, (sequence parameters.length), null,
      description: "Parameters for model '#{model.key.name}'" #TODO frame key
      origin: "getModel #{stringify model.key.name}"

  inspectGLMModelOutput = (model) -> ->
    output = model.output

    vectors = [
      createFactor 'model_category', TString, [ output.model_category ]
      createFactor 'binomial', TString, [ output.binomial ]
      createVector 'aic', TNumber, [ output.aic ]
      createVector 'auc', TNumber, [ output.auc ]
      createVector 'best_lambda_idx', TNumber, [ output.best_lambda_idx ]
      createVector 'null_degrees_of_freedom', TNumber, [ output.null_degrees_of_freedom ]
      createVector 'null_deviance', TNumber, [ output.null_deviance ]
      createVector 'rank', TNumber, [ output.rank ]
      createVector 'residual_degrees_of_freedom', TNumber, [ output.residual_degrees_of_freedom ]
      createVector 'residual_deviance', TNumber, [ output.residual_deviance ]
      createVector 'threshold', TNumber, [ output.threshold ]
    ]

    createDataframe 'output', vectors, (sequence 1), null,
      description: "Output for GLM model '#{model.key.name}'"
      origin: "getModel #{stringify model.key.name}"

  inspectGLMCoefficientsMagnitude = (model) -> ->
    convertTableToFrame model.output.coefficients_magnitude,
      description: "#{model.output.coefficients_magnitude.name} for GLM model #{model.key.name}"
      origin: "getModel #{stringify model.key.name}"

  inspectGLMCoefficientsTable = (model) -> ->
    convertTableToFrame model.output.coefficients_table,
      description: "#{model.output.coefficients_table.name} for GLM model #{model.key.name}"
      origin: "getModel #{stringify model.key.name}"

  inspectGBMModelOutput = (model) -> ->
    output = model.output

    size = output.mse_train.length

    vectors = [
      createVector 'tree', TNumber, (sequence size)
      createVector 'mse_train', TNumber, parseNaNs output.mse_train
      createVector 'mse_valid', TNumber, parseNaNs output.mse_valid
    ]

    createDataframe 'output', vectors, (sequence size), null,
      description: "Output for GBM model '#{model.key.name}'"
      origin: "getModel #{stringify model.key.name}"

  inspectKMeansModelOutput = (model) -> ->
    output = model.output

    vectors = [
      createVector 'avg_between_ss', TNumber, [ output.avg_between_ss ]
      createVector 'avg_ss', TNumber, [ output.avg_ss ]
      createVector 'avg_within_ss', TNumber, [ output.avg_within_ss ]
      createVector 'categorical_column_count', TNumber, [ output.categorical_column_count ]
      createVector 'iterations', TNumber, [ output.iterations ]
      createFactor 'model_category', TString, [ output.model_category ]
    ]

    createDataframe 'output', vectors, (sequence 1), null,
      description: "Output for k-means model '#{model.key.name}'"
      origin: "getModel #{stringify model.key.name}"

  inspectKmeansModelClusters = (model) -> ->
    output = model.output

    vectors = [
      createFactor 'cluster', TString, head output.centers.data
      createVector 'size', TNumber, output.size
      createVector 'within_mse', TNumber, output.within_mse
    ]

    createDataframe 'clusters', vectors, (sequence output.size.length), null, 
      description: "Clusters for k-means model '#{model.key.name}'"
      origin: "getModel #{stringify model.key.name}"

  inspectKmeansModelClusterMeans = (model) -> ->
    convertTableToFrame model.output.centers, 
      description: "Cluster means for k-means model '#{model.key.name}'"
      origin: "getModel #{stringify model.key.name}"

  extendKMeansModel = (model) ->
    inspect_ model,
      parameters: inspectModelParameters model
      output: inspectKMeansModelOutput model
      clusters: inspectKmeansModelClusters model
      'Cluster means': inspectKmeansModelClusterMeans model

  extendDeepLearningModel = (model) ->

    origin = "getModel #{stringify model.key.name}"

    inspections = {}
    inspections.parameters = inspectModelParameters model

    modelCategory = model.output.model_category

    if modelCategory is 'Binomial' or modelCategory is 'Multinomial' or modelCategory is 'Regression' or modelCategory is 'AutoEncoder'
      tables = [ model.output.model_summary, model.output.scoring_history ]
      tables.forEach (table) ->
        inspections[ table.name ] = ->
          convertTableToFrame table,
            description: table.name 
            origin: origin
            plot: "plot inspect '#{table.name}', #{origin}"

      if variableImportances = model.output.variable_importances
        inspections[ variableImportances.name ] = ->
          convertTableToFrame variableImportances,
            description: variableImportances.name
            origin: origin
            plot: "plot inspect '#{variableImportances.name}', #{origin}"

    if modelCategory is 'Binomial'
      if trainMetrics = model.output.train_metrics
        trainMetrics.thresholds_and_metric_scores.name = 'Training ' + trainMetrics.thresholds_and_metric_scores.name
        trainMetrics.max_criteria_and_metric_scores.name = 'Training ' + trainMetrics.max_criteria_and_metric_scores.name

        inspections[ 'Training Metrics' ] = inspectBinomialPrediction2 'Training Metrics', trainMetrics

        inspections[ trainMetrics.thresholds_and_metric_scores.name ] = -> 
          convertTableToFrame trainMetrics.thresholds_and_metric_scores,
            description: trainMetrics.thresholds_and_metric_scores.name
            origin: origin
            plot: "plot inspect '#{trainMetrics.thresholds_and_metric_scores.name}', #{origin}"

        inspections[ trainMetrics.max_criteria_and_metric_scores.name ] = -> 
          convertTableToFrame trainMetrics.max_criteria_and_metric_scores,
            description: trainMetrics.max_criteria_and_metric_scores.name
            origin: origin
            plot: "plot inspect '#{trainMetrics.max_criteria_and_metric_scores.name}', #{origin}"

        inspections[ 'Training Confusion Matrices' ] = inspectBinomialConfusionMatrices2 'Training Confusion Matrices', trainMetrics

      if validMetrics = model.output.valid_metrics
        validMetrics.thresholds_and_metric_scores.name = 'Validation ' + validMetrics.thresholds_and_metric_scores.name
        validMetrics.max_criteria_and_metric_scores.name = 'Validation ' + validMetrics.max_criteria_and_metric_scores.name

        inspections[ 'Validation Metrics' ] = inspectBinomialPrediction2 'Validation Metrics', validMetrics
        inspections[ validMetrics.thresholds_and_metric_scores.name ] = -> 
          convertTableToFrame validMetrics.thresholds_and_metric_scores,
            description: validMetrics.thresholds_and_metric_scores.name
            origin: origin
            plot: "plot inspect '#{validMetrics.thresholds_and_metric_scores.name}', #{origin}"

        inspections[ validMetrics.max_criteria_and_metric_scores.name ] = -> 
          convertTableToFrame validMetrics.max_criteria_and_metric_scores,
            description: validMetrics.max_criteria_and_metric_scores.name
            origin: origin
            plot: "plot inspect '#{validMetrics.max_criteria_and_metric_scores.name}', #{origin}"

        inspections[ 'Validation Confusion Matrices' ] = inspectBinomialConfusionMatrices2 'Validation Confusion Matrices', validMetrics

    else if modelCategory is 'Multinomial'

      if trainMetrics = model.output.train_metrics
        inspections[ 'Training Metrics' ] = inspectMultinomialPrediction2 'Training Metrics', trainMetrics
        if table = trainMetrics.cm.table
          inspectMultinomialConfusionMatrix 'Training Confusion Matrix', table, origin, inspections

      if validMetrics = model.output.valid_metrics
        inspections[ 'Validation Metrics' ] = inspectMultinomialPrediction2 'Validation Metrics', validMetrics
        if table = validMetrics.cm.table
          inspectMultinomialConfusionMatrix 'Validation Confusion Matrix', table, origin, inspections

    else if modelCategory is 'Regression'
      if trainMetrics = model.output.train_metrics
        inspections[ 'Training Metrics' ] = inspectRegressionPrediction2 'Training Metrics', trainMetrics

      if validMetrics = model.output.valid_metrics
        inspections[ 'Validation Metrics' ] = inspectRegressionPrediction2 'Validation Metrics', validMetrics

    inspect_ model, inspections
  
  extendGBMModel = (model) ->
    origin = "getModel #{stringify model.key.name}"

    inspections = {}
    inspections.parameters = inspectModelParameters model
    inspections.output = inspectGBMModelOutput model

    if variableImportances = model.output.variable_importances
      inspections[variableImportances.name] = ->
        convertTableToFrame variableImportances,
          description: variableImportances.name
          origin: origin
          plot: "plot inspect '#{variableImportances.name}', #{origin}"

    inspect_ model, inspections

  extendGLMModel = (model) ->
    inspections = {}
    inspections.parameters = inspectModelParameters model
    inspections.output = inspectGLMModelOutput model
    if model.output.coefficients_magnitude
      inspections[model.output.coefficients_magnitude.name] = inspectGLMCoefficientsMagnitude model 
    if model.output.coefficients_table
      inspections[model.output.coefficients_table.name] = inspectGLMCoefficientsTable model
    inspect_ model, inspections

  extendJob = (job) ->
    render_ job, H2O.JobOutput, job

  extendJobs = (jobs) ->
    for job in jobs
      extendJob job
    render_ jobs, H2O.JobsOutput, jobs

  extendDeletedKeys = (keys) ->
    render_ keys, H2O.DeleteObjectsOutput, keys

  extendModel = (model) ->
    switch model.algo
      when 'kmeans'
        extendKMeansModel model
      when 'deeplearning'
        extendDeepLearningModel model
      when 'gbm', 'drf'
        extendGBMModel model
      when 'glm'
        extendGLMModel model

    render_ model, H2O.ModelOutput, model

  extendModels = (models) ->
    for model in models
      extendModel model

    inspections = {}

    algos = unique (model.algo for model in models)
    if algos.length is 1
      inspections.parameters = inspectParametersAcrossModels models 

    modelCategories = unique (model.output.model_category for model in models)
    # TODO implement model comparision after 2d table cleanup for model metrics
    #if modelCategories.length is 1
    #  inspections.outputs = inspectOutputsAcrossModels (head modelCategories), models
    

    inspect_ models, inspections
    render_ models, H2O.ModelsOutput, models

  read = (value) -> if value is 'NaN' then null else value

  inspectMultinomialPrediction2 = (frameLabel, prediction) -> ->
    { frame, model } = prediction
    origin = "getModel #{stringify prediction.model.name}"

    vectors = [
      createFactor 'model_category', TString, [ prediction.model_category ]
      createVector 'mse', TNumber, [ prediction.mse ]
      createVector 'duration_in_ms', TNumber, [ prediction.duration_in_ms ]
      createVector 'scoring_time', TNumber, [ prediction.scoring_time ]
    ]

    createDataframe frameLabel, vectors, (sequence 1), null,
      description: frameLabel
      origin: origin

  inspectRegressionPrediction2 = (frameLabel, prediction) -> ->
    { frame, model } = prediction
    origin = "getModel #{stringify prediction.model.name}"

    vectors = [
      createFactor 'model_category', TString, [ prediction.model_category ]
      createVector 'mse', TNumber, [ prediction.mse ]
      createVector 'sigma', TNumber, [ prediction.sigma ]
      createVector 'duration_in_ms', TNumber, [ prediction.duration_in_ms ]
      createVector 'scoring_time', TNumber, [ prediction.scoring_time ]
    ]

    createDataframe frameLabel, vectors, (sequence 1), null,
      description: frameLabel
      origin: origin

  inspectRegressionPrediction = (prediction) -> ->
    { frame, model } = prediction

    vectors = [
      createFactor 'key', TString, [ model.name ]
      createFactor 'frame', TString, [ frame.name ]
      createFactor 'model_category', TString, [ prediction.model_category ]
      createVector 'mse', TNumber, [ prediction.mse ]
      createVector 'sigma', TNumber, [ prediction.sigma ]
      createVector 'duration_in_ms', TNumber, [ prediction.duration_in_ms ]
      createVector 'scoring_time', TNumber, [ prediction.scoring_time ]
    ]

    createDataframe 'prediction', vectors, (sequence 1), null,
      description: "Prediction output for model '#{model.name}' on frame '#{frame.name}'"
      origin: "getPrediction model: #{stringify model.name}, frame: #{stringify frame.name}"

  inspectBinomialPrediction2 = (frameLabel, prediction) -> ->
    origin = "getModel #{stringify prediction.model.name}"
    { frame, model } = prediction

    vectors = [
      createFactor 'model_category', TString, [ prediction.model_category ]
      createVector 'AUC', TNumber, [ prediction.AUC ]
      createVector 'Gini', TNumber, [ prediction.Gini ]
      createVector 'mse', TNumber, [ prediction.mse ]
      createVector 'duration_in_ms', TNumber, [ prediction.duration_in_ms ]
      createVector 'scoring_time', TNumber, [ prediction.scoring_time ]
    ]

    createDataframe frameLabel, vectors, (sequence 1), null,
      description: frameLabel
      origin: origin

  inspectBinomialPrediction = (prediction) -> ->
    { frame, model } = prediction

    vectors = [
      createFactor 'key', TString, [ model.name ]
      createFactor 'frame', TString, [ frame.name ]
      createFactor 'model_category', TString, [ prediction.model_category ]
      createVector 'AUC', TNumber, [ prediction.AUC ]
      createVector 'Gini', TNumber, [ prediction.Gini ]
      createVector 'mse', TNumber, [ prediction.mse ]
      createVector 'duration_in_ms', TNumber, [ prediction.duration_in_ms ]
      createVector 'scoring_time', TNumber, [ prediction.scoring_time ]
    ]

    createDataframe 'Prediction', vectors, (sequence 1), null,
      description: "Prediction output for model '#{model.name}' on frame '#{frame.name}'"
      origin: "getPrediction model: #{stringify model.name}, frame: #{stringify frame.name}"

  inspectMultinomialConfusionMatrix = (name, table, origin, inspections) ->
    table.name = name
    inspections[ table.name ] = ->
      convertTableToFrame table,
        description: table.name
        origin: origin

  inspectBinomialConfusionMatrices2 = (frameLabel, prediction) -> ->
    origin = "getModel #{stringify prediction.model.name}"
    vectors = [
      createList 'CM', prediction.confusion_matrices, formatConfusionMatrix
      createVector 'TPR', TNumber, map prediction.confusion_matrices, computeTruePositiveRate
      createVector 'FPR', TNumber, map prediction.confusion_matrices, computeFalsePositiveRate
    ]
    createDataframe frameLabel, vectors, (sequence prediction.confusion_matrices.length), null,
      description: frameLabel
      origin: origin
      plot: "plot inspect '#{frameLabel}', #{origin}"


  inspectBinomialConfusionMatrices = (opts, predictions) -> ->
    vectors = [
      createList 'CM', (concatArrays (prediction.confusion_matrices for prediction in predictions)), formatConfusionMatrix
      createVector 'TPR', TNumber, concatArrays (map prediction.confusion_matrices, computeTruePositiveRate for prediction in predictions)
      createVector 'FPR', TNumber, concatArrays (map prediction.confusion_matrices, computeFalsePositiveRate for prediction in predictions)
      createFactor 'key', TString, concatArrays (repeatValues prediction.confusion_matrices.length, prediction.model.name + ' on ' + prediction.frame.name for prediction in predictions)
    ]

    createDataframe 'Confusion Matrices', vectors, (sequence (head vectors).count()), null,
      description: "Confusion matrices for the selected predictions"
      origin: formulateGetPredictionsOrigin opts
      plot: "plot inspect 'Confusion Matrices', #{formulateGetPredictionsOrigin opts}"

  inspectBinomialMetrics = (opts, predictions) -> ->
    inspectionFrame = combineTables (prediction.max_criteria_and_metric_scores for prediction in predictions)
    convertTableToFrame inspectionFrame,
      description: "Metrics for the selected predictions"
      origin: formulateGetPredictionsOrigin opts
      plot: "plot inspect '#{inspectionFrame.label}', #{formulateGetPredictionsOrigin opts}"

  inspectBinomialPredictions = (opts, predictions) -> ->
    vectors = [
      createFactor 'key', TString, (prediction.model.name + ' on ' + prediction.frame.name for prediction in predictions)
      createFactor 'frame', TString, (prediction.frame.name for prediction in predictions)
      createFactor 'model_category', TString, (prediction.model_category for prediction in predictions)
      createVector 'AUC', TNumber, (prediction.AUC for prediction in predictions)
      createVector 'Gini', TNumber, (prediction.Gini for prediction in predictions)
      createVector 'mse', TNumber, (prediction.mse for prediction in predictions)
      createVector 'duration_in_ms', TNumber, (prediction.duration_in_ms for prediction in predictions)
      createVector 'scoring_time', TNumber, (prediction.scoring_time for prediction in predictions)
    ]

    createDataframe 'predictions', vectors, (sequence predictions.length), null,
      description: "Prediction output for selected predictions."
      origin: formulateGetPredictionsOrigin opts
      plot: "plot inspect 'predictions', #{formulateGetPredictionsOrigin opts}"

  extendPredictions = (opts, predictions) ->
    render_ predictions, H2O.PredictsOutput, opts, predictions
    if predictions.length
      if (every predictions, (prediction) -> prediction.model_category is 'Binomial')
        inspections = {}
        inspections['Prediction' ] = inspectBinomialPredictions opts, predictions
        inspections[ (head predictions).thresholds_and_metric_scores.name ] = inspectBinomialScores opts, predictions
        inspections[ (head predictions).max_criteria_and_metric_scores.name ] = inspectBinomialMetrics opts, predictions
        inspections[ 'Confusion Matrices' ] = inspectBinomialConfusionMatrices opts, predictions
        inspect_ predictions, inspections
      else
        inspect_ predictions, 
          prediction: inspectBinomialPredictions opts, predictions

    predictions

  inspectBinomialScores = (opts, predictions) -> ->
    inspectionFrame = combineTables (prediction.thresholds_and_metric_scores for prediction in predictions)
    convertTableToFrame inspectionFrame,
      description: "Scores for the selected predictions"
      origin: formulateGetPredictionsOrigin opts
      plot: "plot inspect '#{inspectionFrame.label}', #{formulateGetPredictionsOrigin opts}"
    
  extendPrediction = (modelKey, frameKey, prediction) ->
    opts = { model: modelKey, frame: frameKey }
    render_ prediction, H2O.PredictOutput, prediction
    inspections = {}
    switch prediction.model_category
      when 'Regression', 'Clustering'
        inspections.prediction = inspectRegressionPrediction prediction

      when 'Multinomial'
        inspections.prediction = inspectRegressionPrediction prediction
        inspectMultinomialConfusionMatrix 'Confusion Matrix', prediction.cm.table, "getPrediction model: #{stringify modelKey}, frame: #{stringify frameKey}", inspections 
      else
        inspections[ 'Prediction' ] = inspectBinomialPrediction prediction
        inspections[ prediction.thresholds_and_metric_scores.name ] = inspectBinomialScores opts, [ prediction ]
        inspections[ prediction.max_criteria_and_metric_scores.name ] = inspectBinomialMetrics opts, [ prediction ]
        inspections[ 'Confusion Matrices' ] = inspectBinomialConfusionMatrices opts, [ prediction ]

    inspect_ prediction, inspections

  inspectFrameColumns = (tableLabel, frameKey, frame, frameColumns) -> ->
    attrs = [
      'label'
      'missing_count'
      'zero_count'
      'positive_infinity_count'
      'negative_infinity_count'
      'min'
      'max'
      'mean'
      'sigma'
      'type'
      'cardinality'
    ]

    vectors = for name in attrs
      switch name
        when 'min'
          createVector name, TNumber, (head column.mins for column in frameColumns)
        when 'max'
          createVector name, TNumber, (head column.maxs for column in frameColumns)
        when 'cardinality'
          createVector name, TNumber, ((if domain = column.domain then domain.length else undefined) for column in frameColumns)
        when 'label', 'type'
          createFactor name, TString, (column[name] for column in frameColumns)
        else
          createVector name, TNumber, (column[name] for column in frameColumns)
         
    createDataframe tableLabel, vectors, (sequence frameColumns.length), null,
      description: "A list of #{tableLabel} in the H2O Frame."
      origin: "getFrame #{stringify frameKey}"
      plot: "plot inspect '#{tableLabel}', getFrame #{stringify frameKey}"


  inspectFrameData = (frameKey, frame) -> ->
    frameColumns = frame.columns

    vectors = for column in frameColumns
      #XXX format functions
      switch column.type
        when 'int', 'real'
          createVector column.label, TNumber, parseNaNs column.data
        when 'enum'
          domain = column.domain
          createFactor column.label, TString, ((if index? then domain[index] else undefined) for index in column.data)
        when 'time'
          createVector column.label, TNumber, parseNaNs column.data
        when 'string'
          createList column.label, parseNulls column.string_data
        else # uuid / etc.
          createList column.label, parseNulls column.data

    vectors.unshift createVector 'Row', TNumber, (rowIndex + 1 for rowIndex in [frame.row_offset ... frame.row_count])

    createDataframe 'data', vectors, (sequence frame.row_count - frame.row_offset), null,
      description: 'A partial list of rows in the H2O Frame.'
      origin: "getFrame #{stringify frameKey}"

  extendFrame = (frameKey, frame) ->
    inspections =
      columns: inspectFrameColumns 'columns', frameKey, frame, frame.columns
      data: inspectFrameData frameKey, frame

    enumColumns = (column for column in frame.columns when column.type is 'enum')
    inspections.factors = inspectFrameColumns 'factors', frameKey, frame, enumColumns if enumColumns.length > 0
    inspect_ frame, inspections
    render_ frame, H2O.FrameOutput, frame

  extendColumnSummary = (frameKey, frame, columnName) ->
    column = head frame.columns
    rowCount = frame.rows

    inspectPercentiles = ->
      vectors = [
        createVector 'percentile', TNumber, frame.default_percentiles
        createVector 'value', TNumber, column.percentiles
      ]

      createDataframe 'percentiles', vectors, (sequence frame.default_percentiles.length), null, 
        description: "Percentiles for column '#{column.label}' in frame '#{frameKey}'."
        origin: "getColumnSummary #{stringify frameKey}, #{stringify columnName}"

    inspectDistribution = ->
      minBinCount = 32
      { histogram_base:base, histogram_stride:stride, histogram_bins:bins } = column
      width = Math.floor bins.length / minBinCount
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
          for binIndex in [m ... n] when n < bins.length
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

      vectors = [
        createFactor 'interval', TString, intervalData
        createVector 'width', TNumber, widthData
        createVector 'count', TNumber, countData
      ]

      createDataframe 'distribution', vectors, (sequence binCount), null, 
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
        createFactor 'characteristic', TString, characteristicData
        createVector 'count', TNumber, countData
        createVector 'percent', TNumber, percentData
      ]

      createDataframe 'characteristics', vectors, (sequence characteristicData.length), null,
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
      outliers = unique concat column.mins, column.maxs
      minimum = head column.mins
      maximum = head column.maxs

      vectors = [
        createFactor 'column', TString, [ columnName ]
        createVector 'mean', TNumber, [ mean ]
        createVector 'q1', TNumber, [ q1 ]
        createVector 'q2', TNumber, [ q2 ]
        createVector 'q3', TNumber, [ q3 ]
        createVector 'min', TNumber, [ minimum ]
        createVector 'max', TNumber, [ maximum ]
      ]

      createDataframe 'summary', vectors, (sequence 1), null, 
        description: "Summary for column '#{column.label}' in frame '#{frameKey}'."
        origin: "getColumnSummary #{stringify frameKey}, #{stringify columnName}"
        plot: "plot inspect 'summary', getColumnSummary #{stringify frameKey}, #{stringify columnName}"

    inspectDomain = ->
      levels = map column.histogram_bins, (count, index) -> count: count, index: index
      #TODO sort table in-place when sorting is implemented
      sortedLevels = sortBy levels, (level) -> -level.count

      top15Levels = head sortedLevels, 15

      [ labels, counts, percents ] = createArrays 3, top15Levels.length

      for level, i in top15Levels
        labels[i] = column.domain[level.index]
        counts[i] = level.count
        percents[i] = 100 * level.count / rowCount

      vectors = [
        createFactor 'label', TString, labels
        createVector 'count', TNumber, counts
        createVector 'percent', TNumber, percents
      ]

      createDataframe 'domain', vectors, (sequence top15Levels.length), null,
        description: "Domain for column '#{column.label}' in frame '#{frameKey}'."
        origin: "getColumnSummary #{stringify frameKey}, #{stringify columnName}"
        plot: "plot inspect 'domain', getColumnSummary #{stringify frameKey}, #{stringify columnName}"

    inspections =
      characteristics: inspectCharacteristics
    if column.type is 'int' or column.type is 'real'
      inspections.summary = inspectSummary
      inspections.distribution = inspectDistribution
      inspections.percentiles = inspectPercentiles
    else
      inspections.domain = inspectDomain

    inspect_ frame, inspections
    render_ frame, H2O.ColumnSummaryOutput, frameKey, frame, columnName

  requestFrame = (frameKey, go) ->
    _.requestFrame frameKey, (error, frame) ->
      if error
        go error
      else
        go null, extendFrame frameKey, frame

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

  requestSplitFrame = (frameKey, splitRatios, splitKeys, go) ->
    _.requestSplitFrame frameKey, splitRatios, splitKeys, (error, result) ->
      if error
        go error
      else
        #TODO Use job result when API starts supporting jobs.
        #_.requestJob result.key.name, (error, job) ->
        #  if error
        #    go error
        #  else
        #    go null, extendJob job
        go null, extendSplitFrameResult result

  createFrame = (opts) ->
    if opts
      _fork requestCreateFrame, opts
    else
      assist createFrame

  splitFrame = (frameKey, splitRatios, splitKeys) ->
    if frameKey and splitRatios and splitKeys
      _fork requestSplitFrame, frameKey, splitRatios, splitKeys
    else
      assist splitFrame

  getFrames = ->
    _fork requestFrames  

  getFrame = (frameKey) ->
    switch typeOf frameKey
      when 'String'
        _fork requestFrame, frameKey
      else
        assist getFrame

  requestDeleteFrame = (frameKey, go) ->
    _.requestDeleteFrame frameKey, (error, result) ->
      if error then go error else go null, extendDeletedKeys [ frameKey ]

  deleteFrame = (frameKey) ->
    if frameKey
      _fork requestDeleteFrame, frameKey
    else
      assist deleteFrame

  requestDeleteFrames = (frameKeys, go) ->
    futures = map frameKeys, (frameKey) ->
      _fork _.requestDeleteFrame, frameKey
    Flow.Async.join futures, (error, results) ->
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
    Flow.Async.join futures, (error, models) ->
      if error then go error else go null, extendModels models

  getModels = (modelKeys) ->
    if isArray modelKeys
      if modelKeys.length
        _fork requestModelsByKeys, modelKeys     
      else
        _fork requestModels 
    else
      _fork requestModels

  requestModel = (modelKey, go) ->
    _.requestModel modelKey, (error, model) ->
      if error then go error else go null, extendModel model

  getModel = (modelKey) ->
    switch typeOf modelKey
      when 'String'
        _fork requestModel, modelKey
      else
        assist getModel

  requestDeleteModel = (modelKey, go) ->
    _.requestDeleteModel modelKey, (error, result) ->
      if error then go error else go null, extendDeletedKeys [ modelKey ]

  deleteModel = (modelKey) ->
    if modelKey
      _fork requestDeleteModel, modelKey
    else
      assist deleteModel

  requestDeleteModels = (modelKeys, go) ->
    futures = map modelKeys, (modelKey) ->
      _fork _.requestDeleteModel, modelKey
    Flow.Async.join futures, (error, results) ->
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

  extendImportResults = (importResults) ->
    render_ importResults, H2O.ImportFilesOutput, importResults

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

  extendParseSetupResults = (args, parseSetupResults) ->
    render_ parseSetupResults, H2O.SetupParseOutput, args, parseSetupResults

  requestImportAndParseSetup = (paths, go) ->
    _.requestImportFiles paths, (error, importResults) ->
      if error
        go error
      else
        sourceKeys = flatten compact map importResults, (result) -> result.keys
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
        go null, extendParseSetupResults { source_keys: sourceKeys }, parseSetupResults

  setupParse = (args) ->
    if args.paths and isArray args.paths
      _fork requestImportAndParseSetup, args.paths
    else if args.source_keys and isArray args.source_keys
      _fork requestParseSetup, args.source_keys
    else
      assist setupParse

  extendParseResult = (parseResult) ->
    render_ parseResult, H2O.JobOutput, parseResult.job

  requestImportAndParseFiles = (paths, destinationKey, parseType, separator, columnCount, useSingleQuotes, columnNames, columnTypes, deleteOnDone, checkHeader, chunkSize, go) ->
    _.requestImportFiles paths, (error, importResults) ->
      if error
        go error
      else
        sourceKeys = flatten compact map importResults, (result) -> result.keys
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
    destinationKey = opts.destination_key
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
      _fork requestParseFiles, opts.source_keys, destinationKey, parseType, separator, columnCount, useSingleQuotes, columnNames, columnTypes, deleteOnDone, checkHeader, chunkSize

  requestModelBuild = (algo, opts, go) ->
    _.requestModelBuild algo, opts, (error, result) ->
      if error
        go error
      else
        if result.validation_error_count > 0
          messages = (validation.message for validation in result.validation_messages)
          go new Flow.Error "Model build failure: #{messages.join '; '}"
        else
          go null, extendJob head result.jobs


  buildModel = (algo, opts) ->
    if algo and opts and keys(opts).length > 1
      _fork requestModelBuild, algo, opts
    else
      assist buildModel, algo, opts

  requestPredict = (destinationKey, modelKey, frameKey, go) ->
    _.requestPredict destinationKey, modelKey, frameKey, (error, prediction) ->
      if error
        go error
      else
        go null, extendPrediction modelKey, frameKey, prediction

  requestPredicts = (opts, go) ->
    futures = map opts, (opt) ->
      { model: modelKey, frame: frameKey } = opt
      _fork _.requestPredict, null, modelKey, frameKey

    Flow.Async.join futures, (error, predictions) ->
      if error
        go error
      else
        go null, extendPredictions opts, predictions

  predict = (opts={}) ->
    { destination_key, model, models, frame, frames } = opts 
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
        assist predict, destination_key: destination_key, models: models, frames: frames
    else
      if model and frame
        _fork requestPredict, destination_key, model, frame
      else 
        assist predict, destination_key: destination_key, model: model, frame: frame

  requestPrediction = (modelKey, frameKey, go) ->
    _.requestPrediction modelKey, frameKey, (error, prediction) ->
      if error
        go error
      else
        go null, extendPrediction modelKey, frameKey, prediction

  requestPredictions = (opts, go) ->
    if isArray opts
      futures = map opts, (opt) ->
        { model: modelKey, frame: frameKey } = opt
        _fork _.requestPredictions, modelKey, frameKey
      Flow.Async.join futures, (error, predictions) ->
        if error
          go error
        else
          # De-dupe predictions
          uniquePredictions = values indexBy (flatten predictions, yes), (prediction) -> prediction.model.name + prediction.frame.name
          go null, extendPredictions opts, uniquePredictions
    else
      { model: modelKey, frame: frameKey } = opts
      _.requestPredictions modelKey, frameKey, (error, predictions) ->
        if error
          go error
        else
          go null, extendPredictions opts, predictions

  getPrediction = (opts={}) ->
    { destination_key, model, frame } = opts
    if model and frame
      _fork requestPrediction, model, frame
    else
      assist getPrediction, destination_key: destination_key, model: model, frame: frame

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

  requestCurrentNodeIndex = (nodeIndex, go) ->
    if nodeIndex < 0
      _.requestCloud (error, cloud) ->
        if error
          go error
        else
          go null, cloud.node_idx
    else
      go null, nodeIndex

  requestLogFile = (nodeIndex, fileType, go) ->
    _.requestCloud (error, cloud) ->
      if error
        go error
      else
        if nodeIndex < 0 or nodeIndex >= cloud.nodes.length
          nodeIndex = cloud.node_idx
        _.requestLogFile nodeIndex, fileType, (error, logFile) ->
          if error
            go error
          else
            go null, extendLogFile cloud, nodeIndex, fileType, logFile

  getLogFile = (nodeIndex=-1, fileType='info') ->
    _fork requestLogFile, nodeIndex, fileType

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
    render_ rdds, -> H2O.RDDsOutput _, rdds
    rdds

  requestRDDs = (go) ->
    _.requestRDDs (error, rdds) ->
      if error
        go error
      else
        go null, extendRDDs rdds

  getRDDs = ->
    _fork requestRDDs

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
    debug result
    go null, render_ (result or {}), Flow.ObjectBrowser, 'dump', result

  dump = (f) ->
    if f?.isFuture
      _fork dumpFuture, f
    else
      Flow.Async.async -> f 

  assist = (func, args...) ->
    if func is undefined
      _fork proceed, H2O.Assist, [ _assistance ]
    else
      switch func
        when importFiles
          _fork proceed, H2O.ImportFilesInput, []
        when buildModel
          _fork proceed, H2O.ModelInput, args
        when predict, getPrediction
          _fork proceed, H2O.PredictInput, args
        when createFrame
          _fork proceed, H2O.CreateFrameInput, args
        when splitFrame
          _fork proceed, H2O.SplitFrameInput, args
        else
          _fork proceed, H2O.NoAssist, []

  link _.ready, ->
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

  link _.initialized, ->
    #TODO Hack for sparkling-water
    _.requestEndpoints (error, response) ->
      unless error
        for route in response.routes
          if route.url_pattern is '/3/RDDs'
            _assistance.getRDDs =
              description: 'Get a list of RDDs in H<sub>2</sub>O'
              icon: 'database'


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
  importFiles: importFiles
  setupParse: setupParse
  parseFiles: parseFiles
  createFrame: createFrame
  splitFrame: splitFrame
  getFrames: getFrames
  getFrame: getFrame
  deleteFrames: deleteFrames
  deleteFrame: deleteFrame
  getRDDs: getRDDs
  getColumnSummary: getColumnSummary
  buildModel: buildModel
  getModels: getModels
  getModel: getModel
  deleteModels: deleteModels
  deleteModel: deleteModel
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

