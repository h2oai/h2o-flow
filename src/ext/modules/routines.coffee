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

  renderable = Flow.Async.renderable #XXX obsolete

  proceed = (func, args) ->
    renderable Flow.Async.noop, (ignore, go) ->
      go null, apply func, null, [_].concat args or []

  form = (controls, go) ->
    go null, signals controls or []

  gui = (controls) ->
    Flow.Async.renderable form, controls, (form, go) ->
      go null, Flow.Form _, form

  gui[name] = f for name, f of Flow.Gui

  help = -> proceed H2O.Help

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

  grid = (data) ->
    plot
      type: 'text'
      data: data

  extendFrames = (frames) ->
    render_ frames, -> H2O.FramesOutput _, frames
    frames

  #TODO rename
  inspectMultimodelParameters = (models) -> ->
    leader = head models
    parameters = leader.parameters
    variables = for parameter in parameters
      switch parameter.type
        when 'enum', 'Frame', 'string', 'byte[]', 'short[]', 'int[]', 'long[]', 'float[]', 'double[]'
          Flow.Data.Variable parameter.label, TString
        when 'byte', 'short', 'int', 'long', 'float', 'double'
          Flow.Data.Variable parameter.label, TNumber
        when 'string[]'
          Flow.Data.Variable parameter.label, TArray
        when 'boolean'
          Flow.Data.Variable parameter.label, TBoolean
        else
          Flow.Data.Variable parameter.label, TObject

    Record = Flow.Data.Record variables

    rows = new Array models.length
    for model, i in models
      rows[i] = row = new Record()
      for parameter, j in model.parameters
        variable = variables[j]
        row[variable.label] = parameter.actual_value

    modelKeys = (model.key for model in models)

    Flow.Data.Table
      label: 'parameters'
      description: "Parameters for models #{modelKeys.join ', '}"
      variables: variables
      rows: rows
      meta:
        origin: "getModels #{stringify modelKeys}"

  inspectModelParameters = (model) -> ->
    parameters = model.parameters
    variables = [
      Flow.Data.Variable 'label', TString
      Flow.Data.Variable 'type', TString
      Flow.Data.Variable 'level', TString
      Flow.Data.Variable 'actual_value', TObject
      Flow.Data.Variable 'default_value', TObject
    ]

    Record = Flow.Data.Record variables
    rows = new Array parameters.length
    for parameter, i in parameters
      rows[i] = row = new Record()
      for variable in variables
        row[variable.label] = parameter[variable.label]

    Flow.Data.Table
      label: 'parameters'
      description: "Parameters for model '#{model.key}'" #TODO frame key
      variables: variables
      rows: rows
      meta:
        origin: "getModel #{stringify model.key}"

  extendKMeansModel = (model) ->
    inspect_ model,
      parameters: inspectModelParameters model

  extendDeepLearningModel = (model) ->
    inspect_ model,
      parameters: inspectModelParameters model
  
  extendGLMModel = (model) ->
    inspect_ model,
      parameters: inspectModelParameters model

  extendModel = (model) ->
    switch model.algo
      when 'kmeans'
        extendKMeansModel model
      when 'deeplearning'
        extendDeepLearningModel model
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

  computeTruePositiveRate = (cm) ->
    [[tn, fp], [fn, tp]] = cm
    tp / (tp + fn)
    
  computeFalsePositiveRate = (cm) ->
    [[tn, fp], [fn, tp]] = cm
    fp / (fp + tn)

  read = (value) -> if value is 'NaN' then null else value

  inspectPrediction = (prediction) -> ->
    { frame, model, auc } = prediction

    variables = [
      Flow.Data.Variable 'parameter', TString
      Flow.Data.Variable 'value', TObject
    ]

    Record = Flow.Data.Record variables

    rows = []
    rows.push new Record 'key', model.key
    rows.push new Record 'frame', frame.key.name
    rows.push new Record 'model_category', prediction.model_category
    rows.push new Record 'duration_in_ms', prediction.duration_in_ms
    rows.push new Record 'scoring_time', prediction.scoring_time
    rows.push new Record 'AUC', auc.AUC
    rows.push new Record 'Gini', auc.Gini
    rows.push new Record 'threshold_criterion', auc.threshold_criterion

    Flow.Data.Table
      label: 'prediction'
      description: "Prediction output for model '#{model.key}' on frame '#{frame.key.name}'"
      variables: variables
      rows: rows
      meta:
        origin: "getPrediction #{stringify model.key}, #{stringify frame.key.name}"

  inspectMetrics = (opts, predictions) -> ->
    variables = [
      Flow.Data.Variable 'criteria', TString
      Flow.Data.Variable 'threshold', TNumber
      Flow.Data.Variable 'F1', TNumber
      Flow.Data.Variable 'F2', TNumber
      Flow.Data.Variable 'F0point5', TNumber
      Flow.Data.Variable 'accuracy', TNumber
      Flow.Data.Variable 'error', TNumber
      Flow.Data.Variable 'precision', TNumber
      Flow.Data.Variable 'recall', TNumber
      Flow.Data.Variable 'specificity', TNumber
      Flow.Data.Variable 'mcc', TNumber
      Flow.Data.Variable 'max_per_class_error', TNumber
      Flow.Data.Variable 'confusion_matrix', TObject
      Flow.Data.Variable 'TPR', TNumber
      Flow.Data.Variable 'FPR', TNumber
      Flow.Data.Variable 'key', TString
      Flow.Data.Variable 'model', TString
      Flow.Data.Variable 'frame', TString
    ]

    Record = Flow.Data.Record variables

    rows = []
    for prediction in predictions
      { frame, model, auc } = prediction
      for i in [ 0 ... auc.threshold_criteria.length ]
        rows.push new Record(
          auc.threshold_criteria[i]
          read auc.threshold_for_criteria[i]
          read auc.F1_for_criteria[i]
          read auc.F2_for_criteria[i]
          read auc.F0point5_for_criteria[i]
          read auc.accuracy_for_criteria[i]
          read auc.error_for_criteria[i]
          read auc.precision_for_criteria[i]
          read auc.recall_for_criteria[i]
          read auc.specificity_for_criteria[i]
          read auc.mcc_for_criteria[i]
          read auc.max_per_class_error_for_criteria[i]
          cm = auc.confusion_matrix_for_criteria[i] 
          computeTruePositiveRate cm
          computeFalsePositiveRate cm
          model.key + ' on ' + frame.key.name
          model.key
          frame.key.name
        )

    Flow.Data.Table
      label: 'metrics'
      description: "Metrics for the selected predictions"
      variables: variables
      rows: rows
      meta:
        origin: formulateGetPredictionsOrigin opts

  inspectPredictions = (opts, predictions) -> ->
    variables = [
      Flow.Data.Variable 'key', TString
      Flow.Data.Variable 'model', TString
      Flow.Data.Variable 'frame', TString
      Flow.Data.Variable 'model_category', TString
      Flow.Data.Variable 'duration_in_ms', TNumber
      Flow.Data.Variable 'scoring_time', TNumber
      Flow.Data.Variable 'AUC', TNumber
      Flow.Data.Variable 'Gini', TNumber
      Flow.Data.Variable 'threshold_criterion', TString
    ]

    Record = Flow.Data.Record variables
    
    rows = new Array predictions.length
    for prediction, i in predictions
      { frame, model, auc } = prediction
      rows[i] = row = new Record(
        model.key + ' on ' + frame.key.name
        model.key
        frame.key.name
        prediction.model_category
        prediction.duration_in_ms
        prediction.scoring_time
        auc.AUC
        auc.Gini
        auc.threshold_criterion
      )

    Flow.Data.Table
      label: 'predictions'
      description: "Prediction output for selected predictions."
      variables: variables
      rows: rows
      meta:
        origin: formulateGetPredictionsOrigin opts

  extendPredictions = (opts, predictions) ->
    render_ predictions, -> H2O.PredictsOutput _, opts, predictions
    inspect_ predictions,
      predictions: inspectPredictions opts, predictions
      metrics: inspectMetrics opts, predictions
      scores: inspectScores opts, predictions

  inspectScores = (opts, predictions) -> ->

    variables = [
      Flow.Data.Variable 'thresholds', TNumber
      Flow.Data.Variable 'F1', TNumber
      Flow.Data.Variable 'F2', TNumber
      Flow.Data.Variable 'F0point5', TNumber
      Flow.Data.Variable 'accuracy', TNumber
      Flow.Data.Variable 'errorr', TNumber
      Flow.Data.Variable 'precision', TNumber
      Flow.Data.Variable 'recall', TNumber
      Flow.Data.Variable 'specificity', TNumber
      Flow.Data.Variable 'mcc', TNumber
      Flow.Data.Variable 'max_per_class_error', TNumber
      Flow.Data.Variable 'confusion_matrices', TObject
      Flow.Data.Variable 'TPR', TNumber
      Flow.Data.Variable 'FPR', TNumber
      Flow.Data.Variable 'key', TString
      Flow.Data.Variable 'model', TString
      Flow.Data.Variable 'frame', TString
    ]

    Record = Flow.Data.Record variables
    rows = []
    for prediction in predictions
      { frame, model, auc } = prediction
      for i in [ 0 ... auc.thresholds.length ]
        rows.push new Record(
          read auc.thresholds[i]
          read auc.F1[i]
          read auc.F2[i]
          read auc.F0point5[i]
          read auc.accuracy[i]
          read auc.errorr[i]
          read auc.precision[i]
          read auc.recall[i]
          read auc.specificity[i]
          read auc.mcc[i]
          read auc.max_per_class_error[i]
          cm = auc.confusion_matrices[i]
          computeTruePositiveRate cm
          computeFalsePositiveRate cm
          model.key + ' on ' + frame.key.name
          model.key
          frame.key.name
        )

    Flow.Data.Table
      label: 'scores'
      description: "Scores for the selected predictions"
      variables: variables
      rows: rows
      meta:
        origin: formulateGetPredictionsOrigin opts
    
  extendPrediction = (modelKey, frameKey, prediction) ->
    render_ prediction, -> H2O.PredictOutput _, prediction
    inspect_ prediction,
      prediction: inspectPrediction prediction
      scores: inspectScores { model: modelKey, frame: frameKey }, [ prediction ]
      metrics: inspectMetrics { model: modelKey, frame: frameKey }, [ prediction ]

  inspectFrameColumns = (tableLabel, frameKey, frame, frameColumns) -> ->
    variables = [
      Flow.Data.Variable 'label', TString
      Flow.Data.Variable 'missing', TNumber
      Flow.Data.Variable 'zeros', TNumber
      Flow.Data.Variable 'pinfs', TNumber
      Flow.Data.Variable 'ninfs', TNumber
      Flow.Data.Variable 'min', TNumber
      Flow.Data.Variable 'max', TNumber
      Flow.Data.Variable 'mean', TNumber
      Flow.Data.Variable 'sigma', TNumber
      Flow.Data.Variable 'type', TString
      Flow.Data.Variable 'cardinality', TNumber
      Flow.Data.Variable 'precision', TNumber
    ]

    Record = Flow.Data.Record variables
    rows = for column in frameColumns
      row = new Record()
      for variable in variables
        label = variable.label
        switch label
          when 'min'
            row[label] = head column.mins
          when 'max'
            row[label] = head column.maxs
          when 'cardinality'
            row[label] = if domain = column.domain then domain.length else null
          else
            row[label] = column[label] 
      row

    Flow.Data.Table
      label: tableLabel
      description: "A list of #{tableLabel} in the H2O Frame."
      variables: variables
      rows: rows
      meta:
        origin: "getFrame #{stringify frameKey}"

  inspectFrameData = (frameKey, frame) -> ->
    frameColumns = frame.columns
    variables = for column in frameColumns
      #XXX format functions
      switch column.type
        when 'int'
          Flow.Data.Variable column.label, TNumber
        when 'real'
          Flow.Data.Variable column.label, TNumber
        when 'enum'
          Flow.Data.Factor column.label, column.domain
        when 'uuid', 'string'
          Flow.Data.Variable column.label, TString
        when 'time'
          Flow.Data.Variable column.label, TDate
        else
          Flow.Data.Variable column.label, TObject

    Record = Flow.Data.Record variables
    rowCount = (head frameColumns).data.length
    rows = for i in [0 ... rowCount]
      row = new Record()
      for variable, j in variables
        value = frameColumns[j].data[i]
        switch variable.type
          when TNumber, TNumber
            #TODO handle +-Inf
            row[variable.label] = if value is 'NaN' then null else value
          else
            row[variable.label] = value
      row
    
    Flow.Data.Table
      label: 'data'
      description: 'A partial list of rows in the H2O Frame.'
      variables: variables
      rows: rows
      meta:
        origin: "getFrame #{stringify frameKey}"

  extendFrame = (frameKey, frame) ->
    inspections =
      columns: inspectFrameColumns 'columns', frameKey, frame, frame.columns
      data: inspectFrameData frameKey, frame

    enumColumns = (column for column in frame.columns when column.type is 'enum')
    inspections.factors = inspectFrameColumns 'factors', frameKey, frame, enumColumns if enumColumns.length > 0
    inspect_ frame, inspections

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
      distributionDataType = if column.type is 'int' then TNumber else TNumber
      variables = [
        Flow.Data.Variable 'intervalStart', TNumber
        Flow.Data.Variable 'intervalEnd', TNumber
        Flow.Data.Variable 'count', TNumber
      ]

      Record = Flow.Data.Record variables
      
      minBinCount = 32
      { base, stride, bins } = column
      width = Math.floor bins.length / minBinCount
      interval = stride * width
      
      rows = []
      if width > 0
        binCount = minBinCount + if bins.length % width > 0 then 1 else 0
        for i in [0 ... binCount]
          m = i * width
          n = m + width
          count = 0
          for binIndex in [m ... n] when n < bins.length
            count += bins[binIndex]

          row = new Record()
          row.intervalStart = base + i * interval
          row.intervalEnd = row.intervalStart + interval
          row.count = count
          rows.push row
      else
        for count, i in bins
          row = new Record()
          row.intervalStart = base + i * stride
          row.intervalEnd = row.intervalStart + stride
          row.count = count
          rows.push row

      Flow.Data.Table
        label: 'distribution'
        description: "Distribution for column '#{column.label}' in frame '#{frameKey}'."
        variables: variables
        rows: rows
        meta:
          origin: "getColumnSummary #{stringify frameKey}, #{stringify columnName}"

    inspectCharacteristics = ->
      { missing, zeros, pinfs, ninfs } = column
      other = rowCount - missing - zeros - pinfs - ninfs

      variables = [
        label: 'label'
        type: TString
      ,
        label: 'characteristic'
        type: TString
      ,
        label: 'count'
        type: TNumber
        domain: [ 0, rowCount ]
      ,
        label: 'percent'
        type: TNumber
        domain: [ 0, 100 ]
      ]

      characteristics = [ 'Missing', '-Inf', 'Zero', '+Inf', 'Other' ]
      rows = for count, i in [ missing, ninfs, zeros, pinfs, other ]
        label: column.label
        characteristic: characteristics[i]
        count: count
        percent: 100 * count / rowCount

      Flow.Data.Table
        label: 'characteristics'
        description: "Characteristics for column '#{column.label}' in frame '#{frameKey}'."
        variables: variables
        rows: rows
        meta:
          origin: "getColumnSummary #{stringify frameKey}, #{stringify columnName}"
          plot: """
          plot
            title: 'Characteristics for #{frameKey} : #{column.label}'
            type: 'interval'
            data: inspect 'characteristics', getColumnSummary #{stringify frameKey}, #{stringify columnName}
            x: plot.stack 'count'
            color: 'characteristic'
          """

    inspectSummary = ->
      variables = [
        label: 'mean'
        type: TNumber
      ,
        label: 'q1'
        type: TNumber
      ,
        label: 'q2'
        type: TNumber
      ,
        label: 'q3'
        type: TNumber
      ,
        label: 'outliers'
        type: TArray
      ]

      defaultPercentiles = frame.default_pctiles
      percentiles = column.pctiles

      mean = column.mean
      q1 = percentiles[defaultPercentiles.indexOf 0.25]
      q2 = percentiles[defaultPercentiles.indexOf 0.5]
      q3 = percentiles[defaultPercentiles.indexOf 0.75]
      outliers = unique concat column.mins, column.maxs

      row =
        mean: mean
        q1: q1
        q2: q2
        q3: q3
        outliers: outliers

      Flow.Data.Table
        label: 'summary'
        description: "Summary for column '#{column.label}' in frame '#{frameKey}'."
        variables: variables
        rows: [ row ]
        meta:
          origin: "getColumnSummary #{stringify frameKey}, #{stringify columnName}"

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

    switch column.type
      when 'int', 'real'
        inspect_ frame,
          characteristics: inspectCharacteristics
          summary: inspectSummary
          distribution: inspectDistribution
          percentiles: inspectPercentiles
      else
        inspect_ frame,
          characteristics: inspectCharacteristics
          domain: inspectDomain
          percentiles: inspectPercentiles


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

  getFrames = ->
    _fork requestFrames  

  getFrame = (frameKey) ->
    switch typeOf frameKey
      when 'String'
        renderable requestFrame, frameKey, (frame, go) ->
          go null, H2O.FrameOutput _, frame
      else
        assist getFrame

  getColumnSummary = (frameKey, columnName) ->
    renderable requestColumnSummary, frameKey, columnName, (frame, go) ->
      go null, H2O.ColumnSummaryOutput _, frameKey, frame, columnName

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

  loadScript = (path, go) ->
    onDone = (script, status) -> go null, script:script, status:status
    onFail = (jqxhr, settings, error) -> go error #TODO use framework error

    $.getScript path
      .done onDone
      .fail onFail

  assist = (func, args...) ->
    if func is undefined
      proceed H2O.Assist, [ _assistance ]
    else
      switch func
        when importFiles
          proceed H2O.ImportFilesInput
        when buildModel
          proceed H2O.ModelInput, args
        when predict, getPrediction
          proceed H2O.PredictInput, args
        else
          proceed H2O.NoAssistView

  link _.ready, ->
    link _.inspect, inspect

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
  inspect: inspect
  plot: plot
  grid: grid
  get: _get
  #
  # Meta
  assist: assist
  help: help
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
  getFrames: getFrames
  getFrame: getFrame
  getColumnSummary: getColumnSummary
  buildModel: buildModel
  getModels: getModels
  getModel: getModel
  predict: predict
  getPrediction: getPrediction
  getPredictions: getPredictions

