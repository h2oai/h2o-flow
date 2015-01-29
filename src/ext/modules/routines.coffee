

createVector = window.plot.createVector
createFactor = window.plot.createFactor
createList = window.plot.createList
createDataframe = window.plot.createFrame

_assistance =
  importFiles:
    description: 'Import file(s) into H<sub>2</sub>O'
    icon: 'files-o'
  getFrames:
    description: 'Get a list of frames in H<sub>2</sub>O'
    icon: 'database'
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

parseNaNs = (source) ->
  target = new Array source.length
  for element, i in source
    target[i] = if element is 'NaN' then undefined else element
  target

parseNulls=  (source) ->
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
      a.concat.apply a, rest arrays

computeTruePositiveRate = (cm) ->
  [[tn, fp], [fn, tp]] = cm
  tp / (tp + fn)
  
computeFalsePositiveRate = (cm) ->
  [[tn, fp], [fn, tp]] = cm
  fp / (fp + tn)

formatConfusionMatrix = (cm) ->
  [[tn, fp], [fn, tp]] = cm
  [ table, tbody, tr, td ] = Flow.HTML.template 'table.flow-matrix', 'tbody', 'tr', '=td'

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

  proceed = (func, args, go) ->
    go null, render_ {}, -> apply func, null, [_].concat args or []

  renderable = Flow.Async.renderable #XXX obsolete

  form = (controls, go) ->
    go null, signals controls or []

  gui = (controls) ->
    Flow.Async.renderable form, controls, (form, go) ->
      go null, Flow.Form _, form

  gui[name] = f for name, f of Flow.Gui

  flow_ = (raw) ->
    raw._flow_ or raw._flow_ = _cache_: {}

  render_ = (raw, render) ->
    (flow_ raw).render = render
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
        render_ inspections, -> H2O.InspectsOutput _, inspections
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
    render_ inspection, -> H2O.InspectOutput _, inspection
    inspection

  __plot = (config, go) ->
    Flow.Plot config, (error, plot) ->
      if error
        go new Flow.Error 'Error rendering plot.', error
      else
        go null, plot

  _plot = (config, go) ->
    #XXX clean up - duplicated in plot() for plot inputs
    if config.data
      if _isFuture config.data
        config.data (error, data) ->
          if error
            go new Flow.Error 'Error evaluating data for plot().', error
          else
            config.data = data
            __plot config, go
      else
        __plot config, go
    else
      go new Flow.Error "Cannot plot(): missing 'data'."

  _plotInput = (config, go) ->
    if config.data
      if _isFuture config.data
        config.data (error, data) ->
          if error
            go new Flow.Error 'Error evaluating data for plot().', error
          else
            config.data = data
            go null, config
      else
        go null, config
    else
      go new Flow.Error "Cannot plot(): missing 'data'."

  plot = (config) ->
    configKeys = keys config
    if (configKeys.length is 1) and 'data' is head configKeys
      renderable _plotInput, config, (config, go) ->
        go null, H2O.PlotInput _, config
    else
      renderable _plot, config, (plot, go) ->
        go null, H2O.PlotOutput _, plot

  plot.stack = Flow.Plot.stack

  _plot1 = (plot, go) ->
    plot (error, vis) ->
      if error
        go new Flow.Error 'Error rendering vis.', error
      else
        go null, vis

  plot1 = (f) ->
    if _isFuture f
      throw new Error 'TODO Display plot input'
      #XXX
      #renderable _plotInput, config, (config, go) ->
      #  go null, H2O.PlotInput _, config
    else
      renderable _plot1, (f window.plot), (plot, go) ->
        go null, H2O.PlotOutput _, plot.element

  grid = (data) ->
    plot
      type: 'text'
      data: data

  extendCloud = (cloud) ->
    render_ cloud, -> H2O.CloudOutput _, cloud

  extendTimeline = (timeline) ->
    render_ timeline, -> H2O.TimelineOutput _, timeline

  extendStackTrace = (stackTrace) ->
    render_ stackTrace, -> H2O.StackTraceOutput _, stackTrace

  extendLogFile = (nodeIndex, logFile) ->
    render_ logFile, -> H2O.LogFileOutput _, nodeIndex, logFile

  extendProfile = (profile) ->
    render_ profile, -> H2O.ProfileOutput _, profile

  extendFrames = (frames) ->
    render_ frames, -> H2O.FramesOutput _, frames
    frames

  #TODO rename
  inspectMultimodelParameters = (models) -> ->
    leader = head models
    vectors = for i in [ 0 ... leader.parameters.length ]
      data = for model in models
        value = model.parameters[i].actual_value
        if value? then value else undefined
      switch parameter.type
        when 'enum', 'Frame', 'string', 'string[]', 'byte[]', 'short[]', 'int[]', 'long[]', 'float[]', 'double[]'
          createFactor parameter.label, TString, data
        when 'byte', 'short', 'int', 'long', 'float', 'double'
          createVector parameter.label, TNumber, data
        when 'boolean'
          createList parameter.label, data, (a) -> if a then 'true' else 'false'
        else
          createList parameter.label, data

    modelKeys = (model.key for model in models)

    createDataframe 'parameters', vectors, (sequence models.length), null,
      description: "Parameters for models #{modelKeys.join ', '}"
      origin: "getModels #{stringify modelKeys}"


  inspectModelParameters = (model) -> ->
    parameters = model.parameters

    attrs = [
      [ 'label', TString ]
      [ 'type', TString ]
      [ 'level', TString ]
      [ 'actual_value', TObject ]
      [ 'default_value', TObject ]
    ]

    vectors = for [ name, type ] in attrs
      data = new Array parameters.length

      for parameter, i in parameters
        data[i] = parameter[name]

      switch type
        when TString
          createFactor name, type, data
        when TObject
          createList name, data, stringify

    createDataframe 'parameters', vectors, (sequence parameters.length), null,
      description: "Parameters for model '#{model.key.name}'" #TODO frame key
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

  inspectKMeansModelClusterMeans = (model) -> ->
    output = model.output

    vectors = [
      createFactor 'cluster', TString, output.centers.rowHeaders
      createVector 'size', TNumber, output.size
      createVector 'within_mse', TNumber, output.within_mse
    ]

    createDataframe 'cluster_means', vectors, (sequence output.size.length), null, 
      description: "Cluster means for k-means model '#{model.key.name}'"
      origin: "getModel #{stringify model.key.name}"

  inspectKmeansModelClusters = (model) -> ->
    output = model.output

    vectors = for header, i in output.centers.colHeaders
      data = for row in output.centers_raw
        row[i]
      createVector header, TNumber, data

    vectors.unshift createFactor 'cluster', TString, output.centers.rowHeaders

    createDataframe 'clusters', vectors, (sequence output.centers_raw.length), null, 
      description: "Clusters for k-means model '#{model.key.name}'"
      origin: "getModel #{stringify model.key.name}"

  extendKMeansModel = (model) ->
    inspect_ model,
      parameters: inspectModelParameters model
      output: inspectKMeansModelOutput model
      clusters: inspectKmeansModelClusters model
      cluster_means: inspectKMeansModelClusterMeans model

  extendDeepLearningModel = (model) ->
    inspect_ model,
      parameters: inspectModelParameters model
  
  extendGBMModel = (model) ->
    inspect_ model,
      parameters: inspectModelParameters model
      output: inspectGBMModelOutput model

  extendGLMModel = (model) ->
    inspect_ model,
      parameters: inspectModelParameters model

  extendJob = (job) ->
    render_ job, -> H2O.JobOutput _, job

  extendModel = (model) ->
    switch model.algo
      when 'kmeans'
        extendKMeansModel model
      when 'deeplearning'
        extendDeepLearningModel model
      when 'gbm'
        extendGBMModel model
      when 'glm'
        extendGLMModel model

    render_ model, -> H2O.ModelOutput _, model

  extendModels = (models) ->
    for model in models
      extendModel model

    algos = unique (model.algo for model in models)
    if algos.length is 1
      inspect_ models,
        parameters: inspectMultimodelParameters models 


    render_ models, -> H2O.ModelsOutput _, models

  read = (value) -> if value is 'NaN' then null else value

  inspectRegressionPrediction = (prediction) -> ->
    { frame, model, predictions } = prediction

    vectors = [
      createFactor 'key', TString, [ model.name ]
      createFactor 'frame', TString, [ frame.name ]
      createFactor 'model_category', TString, [ prediction.model_category ]
      createVector 'duration_in_ms', TString, [ prediction.duration_in_ms ]
      createVector 'scoring_time', TString, [ prediction.scoring_time ]
    ]

    createDataframe 'prediction', vectors, (sequence 1), null,
      description: "Prediction output for model '#{model.name}' on frame '#{frame.name}'"
      origin: "getPrediction #{stringify model.name}, #{stringify frame.name}"

  inspectBinomialPrediction = (prediction) -> ->
    { frame, model, auc } = prediction

    vectors = [
      createFactor 'key', TString, [ model.name ]
      createFactor 'frame', TString, [ frame.name ]
      createFactor 'model_category', TString, [ prediction.model_category ]
      createVector 'duration_in_ms', TNumber, [ prediction.duration_in_ms ]
      createVector 'scoring_time', TNumber, [ prediction.scoring_time ]
      createVector 'AUC', TNumber, [ auc.AUC ]
      createVector 'Gini', TNumber, [ auc.Gini ]
      createFactor 'threshold_criterion', TString, [ auc.threshold_criterion ]
    ]

    createDataframe 'prediction', vectors, (sequence 1), null,
      description: "Prediction output for model '#{model.name}' on frame '#{frame.name}'"
      origin: "getPrediction #{stringify model.name}, #{stringify frame.name}"

  inspectBinomialMetrics = (opts, predictions) -> ->
    vectors = [
      createFactor 'criteria', TString, concatArrays (prediction.auc.threshold_criteria for prediction in predictions)
      createVector 'threshold', TNumber, concatArrays (parseNaNs prediction.auc.threshold_for_criteria for prediction in predictions)
      createVector 'F1', TNumber, concatArrays (parseNaNs prediction.auc.F1_for_criteria for prediction in predictions)
      createVector 'F2', TNumber, concatArrays (parseNaNs prediction.auc.F2_for_criteria for prediction in predictions)
      createVector 'F0point5', TNumber, concatArrays (parseNaNs prediction.auc.F0point5_for_criteria for prediction in predictions)
      createVector 'accuracy', TNumber, concatArrays (parseNaNs prediction.auc.accuracy_for_criteria for prediction in predictions)
      createVector 'error', TNumber, concatArrays (parseNaNs prediction.auc.error_for_criteria for prediction in predictions)
      createVector 'precision', TNumber, concatArrays (parseNaNs prediction.auc.precision_for_criteria for prediction in predictions)
      createVector 'recall', TNumber, concatArrays (parseNaNs prediction.auc.recall_for_criteria for prediction in predictions)
      createVector 'specificity', TNumber, concatArrays (parseNaNs prediction.auc.specificity_for_criteria for prediction in predictions)
      createVector 'mcc', TNumber, concatArrays (parseNaNs prediction.auc.max_per_class_error_for_criteria for prediction in predictions)
      createVector 'max_per_class_error', TNumber, concatArrays (parseNaNs prediction.auc.max_per_class_error for prediction in predictions)
      createList 'confusion_matrix', (concatArrays (prediction.auc.confusion_matrix_for_criteria for prediction in predictions)), formatConfusionMatrix
      createVector 'TPR', TNumber, concatArrays (map prediction.auc.confusion_matrix_for_criteria, computeTruePositiveRate for prediction in predictions)
      createVector 'FPR', TNumber, concatArrays (map prediction.auc.confusion_matrix_for_criteria, computeFalsePositiveRate for prediction in predictions)
      createFactor 'key', TString, concatArrays (repeatValues prediction.auc.threshold_criteria.length, prediction.model.name + ' on ' + prediction.frame.name for prediction in predictions)
      createFactor 'model', TString, concatArrays (repeatValues prediction.auc.threshold_criteria.length, prediction.model.name for prediction in predictions)
      createFactor 'frame', TString, concatArrays (repeatValues prediction.auc.threshold_criteria.length, prediction.frame.name for prediction in predictions)
    ]

    createDataframe 'metrics', vectors, (sequence (head vectors).count()), null,
      description: "Metrics for the selected predictions"
      origin: formulateGetPredictionsOrigin opts
      plot: """
      plot
        data: inspect 'metrics', #{formulateGetPredictionsOrigin opts}
      """

  inspectBinomialPredictions = (opts, predictions) -> ->
    vectors = [
      createFactor 'key', TString, (prediction.model.name + ' on ' + prediction.frame.name for prediction in predictions)
      createFactor 'frame', TString, (prediction.frame.name for prediction in predictions)
      createFactor 'model_category', TString, (prediction.model_category for prediction in predictions)
      createVector 'duration_in_ms', TNumber, (prediction.duration_in_ms for prediction in predictions)
      createVector 'scoring_time', TNumber, (prediction.scoring_time for prediction in predictions)
      #createVector 'AUC', TNumber, (prediction.auc.AUC for prediction in predictions)
      #createVector 'Gini', TNumber, (prediction.auc.Gini for prediction in predictions)
      #createFactor 'threshold_criterion', TString, (prediction.auc.threshold_criterion for prediction in predictions)
    ]

    createDataframe 'predictions', vectors, (sequence predictions.length), null,
      description: "Prediction output for selected predictions."
      origin: formulateGetPredictionsOrigin opts
      plot: """
      plot
        data: inspect 'predictions', #{formulateGetPredictionsOrigin opts}
      """

  extendPredictions = (opts, predictions) ->
    render_ predictions, -> H2O.PredictsOutput _, opts, predictions
    if (every predictions, (prediction) -> prediction.model_category is 'Binomial')
      inspect_ predictions,
        predictions: inspectBinomialPredictions opts, predictions
        metrics: inspectBinomialMetrics opts, predictions
        scores: inspectBinomialScores opts, predictions
    else
      inspect_ predictions,
        predictions: inspectBinomialPredictions opts, predictions
        #metrics: inspectBinomialMetrics opts, predictions
        #scores: inspectBinomialScores opts, predictions

  inspectBinomialScores = (opts, predictions) -> ->
    vectors = [
      createVector 'thresholds', TNumber, concatArrays (parseNaNs prediction.auc.thresholds for prediction in predictions)
      createVector 'F1', TNumber, concatArrays (parseNaNs prediction.auc.F1 for prediction in predictions)
      createVector 'F2', TNumber, concatArrays (parseNaNs prediction.auc.F2 for prediction in predictions)
      createVector 'F0point5', TNumber, concatArrays (parseNaNs prediction.auc.F0point5 for prediction in predictions)
      createVector 'accuracy', TNumber, concatArrays (parseNaNs prediction.auc.accuracy for prediction in predictions)
      createVector 'errorr', TNumber, concatArrays (parseNaNs prediction.auc.errorr for prediction in predictions)
      createVector 'precision', TNumber, concatArrays (parseNaNs prediction.auc.precision for prediction in predictions)
      createVector 'recall', TNumber, concatArrays (parseNaNs prediction.auc.recall for prediction in predictions)
      createVector 'specificity', TNumber, concatArrays (parseNaNs prediction.auc.specificity for prediction in predictions)
      createVector 'mcc', TNumber, concatArrays (parseNaNs prediction.auc.mcc for prediction in predictions)
      createVector 'max_per_class_error', TNumber, concatArrays (parseNaNs prediction.auc.max_per_class_error for prediction in predictions)
      createList 'confusion_matrices', (concatArrays (prediction.auc.confusion_matrices for prediction in predictions)), formatConfusionMatrix
      createVector 'TPR', TNumber, concatArrays (map prediction.auc.confusion_matrices, computeTruePositiveRate for prediction in predictions)
      createVector 'FPR', TNumber, concatArrays (map prediction.auc.confusion_matrices, computeFalsePositiveRate for prediction in predictions)
      createFactor 'key', TString, concatArrays (repeatValues prediction.auc.thresholds.length, prediction.model.name + ' on ' + prediction.frame.name for prediction in predictions)
      createFactor 'model', TString, concatArrays (repeatValues prediction.auc.thresholds.length, prediction.model.name for prediction in predictions)
      createFactor 'frame', TString, concatArrays (repeatValues prediction.auc.thresholds.length, prediction.frame.name for prediction in predictions)
    ]

    createDataframe 'scores', vectors, (sequence (head vectors).count()), null, 
      description: "Scores for the selected predictions"
      origin: formulateGetPredictionsOrigin opts
      plot: """
      plot
        data: inspect 'scores', #{formulateGetPredictionsOrigin opts}
      """
    
  extendPrediction = (modelKey, frameKey, prediction) ->
    render_ prediction, -> H2O.PredictOutput _, prediction
    switch prediction.model_category
      when 'Regression', 'Multinomial'
        inspect_ prediction,
          prediction: inspectRegressionPrediction prediction
      else
        inspect_ prediction,
          prediction: inspectBinomialPrediction prediction
          scores: inspectBinomialScores { model: modelKey, frame: frameKey }, [ prediction ]
          metrics: inspectBinomialMetrics { model: modelKey, frame: frameKey }, [ prediction ]

  inspectFrameColumns = (tableLabel, frameKey, frame, frameColumns) -> ->
    attrs = [
      'label'
      'missing'
      'zeros'
      'pinfs'
      'ninfs'
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
        else # uuid / string / etc.
          createList column.label, parseNulls column.data

    createDataframe 'data', vectors, (sequence (head frameColumns).data.length), null,
      description: 'A partial list of rows in the H2O Frame.'
      origin: "getFrame #{stringify frameKey}"

  extendFrame = (frameKey, frame) ->
    inspections =
      columns: inspectFrameColumns 'columns', frameKey, frame, frame.columns
      data: inspectFrameData frameKey, frame

    enumColumns = (column for column in frame.columns when column.type is 'enum')
    inspections.factors = inspectFrameColumns 'factors', frameKey, frame, enumColumns if enumColumns.length > 0
    inspect_ frame, inspections
    render_ frame, -> H2O.FrameOutput _, frame

  extendColumnSummary = (frameKey, frame, columnName) ->
    column = head frame.columns
    rowCount = frame.rows

    inspectPercentiles = ->
      percentiles = frame.default_pctiles
      percentileValues = column.pctiles

      variables = [
        Flow.Data.Variable 'percentile', TNumber
        Flow.Data.Variable 'value', TNumber #TODO depends on type of variable?
      ]

      Record = Flow.Data.Record variables
      rows = for percentile, i in percentiles
        row = new Record()
        row.percentile = percentile
        row.value = percentileValues[i]
        row

      Flow.Data.Table
        label: 'percentiles'
        description: "Percentiles for column '#{column.label}' in frame '#{frameKey}'."
        variables: variables
        rows: rows
        meta:
          origin: "getColumnSummary #{stringify frameKey}, #{stringify columnName}"

    inspectDistribution = ->
      minBinCount = 32
      { base, stride, bins } = column
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
        plot: """
        plot1 (g) -> g(
          g.rect(
            g.position 'interval', 'count'
            g.width g.value 1
          )
          g.from inspect 'distribution', getColumnSummary #{stringify frameKey}, #{stringify columnName}
        )
        """

    inspectCharacteristics = ->
      { missing, zeros, pinfs, ninfs } = column
      other = rowCount - missing - zeros - pinfs - ninfs

      characteristicData = [ 'Missing', '-Inf', 'Zero', '+Inf', 'Other' ]
      countData = [ missing, ninfs, zeros, pinfs, other ]
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

    inspectSummary = ->
      defaultPercentiles = frame.default_pctiles
      percentiles = column.pctiles

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
        plot: """
        plot1 (g) -> g(
          g.schema(
            g.position 'min', 'q1', 'q2', 'q3', 'max', 'column'
          )
          g.from inspect 'summary', getColumnSummary #{stringify frameKey}, #{stringify columnName}
        )
        """

    inspectDomain = ->
      levels = map column.bins, (count, index) -> count: count, index: index
      #TODO sort table in-place when sorting is implemented
      sortedLevels = sortBy levels, (level) -> -level.count

      variables = [
        Flow.Data.Variable 'label', TString
        countVariable = Flow.Data.Variable 'count', TNumber
        Flow.Data.Variable 'percent', TNumber, [ 0, 100 ]
      ]

      Record = Flow.Data.Record variables
      rows = for level in sortedLevels
        row = new Record()
        row.label = column.domain[level.index]
        row.count = countVariable.read level.count
        row.percent = 100 * level.count / rowCount
        row
      
      Flow.Data.Table
        label: 'domain'
        description: "Domain for column '#{column.label}' in frame '#{frameKey}'."
        variables: variables
        rows: rows
        meta:
          origin: "getColumnSummary #{stringify frameKey}, #{stringify columnName}"
          plot: """
          plot
            title: 'Domain for #{frameKey} : #{column.label}'
            type: 'interval'
            data: inspect 'domain', getColumnSummary #{stringify frameKey}, #{stringify columnName}
            x: 'count'
            y: 'label'
          """

    inspections =
      characteristics: inspectCharacteristics
    if column.type is 'int' or column.type is 'real'
      inspections.summary = inspectSummary
      inspections.distribution = inspectDistribution
    else
      inspections.domain = inspectDomain

    inspect_ frame, inspections
    render_ frame, -> go null, H2O.ColumnSummaryOutput _, frameKey, frame, columnName

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

  createFrame = (opts) ->
    if opts
      _fork requestCreateFrame, opts
    else
      assist createFrame

  getFrames = ->
    _fork requestFrames  

  getFrame = (frameKey) ->
    switch typeOf frameKey
      when 'String'
        _fork requestFrame, frameKey
      else
        assist getFrame

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

  getJobs = ->
    renderable _.requestJobs, (jobs, go) ->
      go null, H2O.JobsOutput _, jobs    

  getJob = (arg) ->
    switch typeOf arg
      when 'String'
        renderable _.requestJob, arg, (job, go) ->
          go null, H2O.JobOutput _, job
      when 'Object'
        if arg.key?
          getJob arg.key
        else
          assist getJob
      else
        assist getJob

  importFiles = (paths) ->
    switch typeOf paths
      when 'Array'
        renderable _.requestImportFiles, paths, (importResults, go) ->
          go null, H2O.ImportFilesOutput _, importResults
      else
        assist importFiles

  setupParse = (sourceKeys) ->
    switch typeOf sourceKeys
      when 'Array'
        renderable _.requestParseSetup, sourceKeys, (parseSetupResults, go) ->
          go null, H2O.SetupParseOutput _, parseSetupResults
      else
        assist setupParse

  parseRaw = (opts) -> #XXX review args
    #XXX validation

    sourceKeys = opts.srcs
    destinationKey = opts.hex
    parserType = opts.pType
    separator = opts.sep
    columnCount = opts.ncols
    useSingleQuotes = opts.singleQuotes
    columnNames = opts.columnNames
    deleteOnDone = opts.delete_on_done
    checkHeader = opts.checkHeader

    renderable _.requestParseFiles, sourceKeys, destinationKey, parserType, separator, columnCount, useSingleQuotes, columnNames, deleteOnDone, checkHeader, (parseResult, go) ->
      go null, H2O.ParseOutput _, parseResult

  buildModel = (algo, opts) ->
    if algo and opts and keys(opts).length > 1
      renderable _.requestModelBuild, algo, opts, (result, go) ->
        if result.validation_error_count > 0
          messages = (validation.message for validation in result.validation_messages)
          go new Flow.Error "Model build failure: #{messages.join '; '}"
        else
          go null, H2O.JobOutput _, head result.jobs
    else
      assist buildModel, algo, opts

  requestPredict = (modelKey, frameKey, go) ->
    _.requestPredict modelKey, frameKey, (error, prediction) ->
      if error
        go error
      else
        go null, extendPrediction modelKey, frameKey, prediction

  requestPredicts = (opts, go) ->
    futures = map opts, (opt) ->
      { model: modelKey, frame: frameKey } = opt
      _fork _.requestPredict, modelKey, frameKey

    Flow.Async.join futures, (error, predictions) ->
      if error
        go error
      else
        go null, extendPredictions opts, predictions

  predict = (model, frame) ->
    if model and frame
      if (isString model) and (isString frame)
        _fork requestPredict, model, frame
      else
        model = [ model ] if isString model
        frame = [ frame ] if isString frame
        opts = []
        for modelKey in model
          for frameKey in frame
            opts.push model: modelKey, frame: frameKey
        _fork requestPredicts, opts
    else
      assist predict, model, frame

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
          uniquePredictions = values indexBy (flatten predictions, yes), (prediction) -> prediction.model.key + prediction.frame.key.name
          go null, extendPredictions opts, uniquePredictions
    else
      { model: modelKey, frame: frameKey } = opts
      _.requestPredictions modelKey, frameKey, (error, predictions) ->
        if error
          go error
        else
          go null, extendPredictions opts, predictions

  getPrediction = (modelKey, frameKey) ->
    if modelKey and frameKey
      _fork requestPrediction, modelKey, frameKey
    else
      assist getPrediction, modelKey, frameKey

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

  requestLogFile = (nodeIndex, go) ->
    _.requestLogFile nodeIndex, (error, logFile) ->
      if error
        go error
      else
        go null, extendLogFile nodeIndex, logFile

  getLogFile = (nodeIndex=-1) ->
    _fork requestLogFile, nodeIndex

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
    go null, render_ (result or {}), ->
      Flow.ObjectBrowser 'dump', result

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
        else
          _fork proceed, H2O.NoAssist, []

  link _.ready, ->
    link _.inspect, inspect
    link _.plot, __plot

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
  plot1: plot1
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
  parseRaw: parseRaw
  createFrame: createFrame
  getFrames: getFrames
  getFrame: getFrame
  getColumnSummary: getColumnSummary
  buildModel: buildModel
  getModels: getModels
  getModel: getModel
  predict: predict
  getPrediction: getPrediction
  getPredictions: getPredictions
  getCloud: getCloud
  getTimeline: getTimeline
  getProfile: getProfile
  getStackTrace: getStackTrace
  getLogFile: getLogFile

