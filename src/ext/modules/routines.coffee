lightning = if window?.plot? then window.plot else {}
if lightning.settings
  lightning.settings.axisLabelFont = '11px "Source Code Pro", monospace'
  lightning.settings.axisTitleFont = 'bold 11px "Source Code Pro", monospace'

createTempKey = -> Flow.Util.uuid().replace /\-/g, ''
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
      createVector column.name, TNumber, (parseNumbers data), format4f
    when 'string'
      createFactor column.name, TString, data
    when 'matrix'
      createList column.name, data, formatConfusionMatrix
    else
      createList column.name, data

convertTableToFrame = (table, tableName, metadata) ->
  #TODO handle format strings and description
  vectors = for column, i in table.columns
    convertColumnToVector column, table.data[i]
  createDataframe tableName, vectors, (sequence table.rowcount), null, metadata

getTwoDimData = (table, columnName) ->
  columnIndex = findIndex table.columns, (column) -> column.name is columnName
  if columnIndex >= 0
    table.data[columnIndex]
  else
    undefined

format4f = (number) ->
  if number
    number.toFixed(4).replace(/\.0+$/, '.0')
  else
    number

format6fi = (number) ->
  if number
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

parseAndFormat = (source) ->
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
    convertTableToFrame testResult.table, testResult.table.name,
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

  extendJob = (job) ->
    render_ job, H2O.JobOutput, job

  extendJobs = (jobs) ->
    for job in jobs
      extendJob job
    render_ jobs, H2O.JobsOutput, jobs

  extendDeletedKeys = (keys) ->
    render_ keys, H2O.DeleteObjectsOutput, keys

  inspectTwoDimTable_ = (origin, tableName, table) -> ->
    convertTableToFrame table, tableName,
      description: table.name
      origin: origin

  inspectRawArray_ = (name, origin, description, array) -> ->
    createDataframe name, [createList name, parseAndFormat array], (sequence array.length), null,
      description: description
      origin: origin

  inspectRawObject_ = (name, origin, description, obj) -> ->
    vectors = for k, v of obj
      createList k, [ if v is null then undefined else if isNumber v then format6fi v else v ]

    createDataframe name, vectors, (sequence 1), null,
      description: description
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
      fields: 'names domains help'
    PCAOutput:
      fields: 'names domains help'
    ModelMetricsBinomial: 
      fields: null
      transform: (metrics) ->
        scores = metrics.thresholds_and_metric_scores
        tps = getTwoDimData scores, 'tps'
        tns = getTwoDimData scores, 'tns'
        fps = getTwoDimData scores, 'fps'
        fns = getTwoDimData scores, 'fns'

        cms = for tp, i in tps
          [[tns[i], fps[i]], [fns[i], tp]]

        tprs = for tp, i in tps
          tp / (tp + fns[i])

        fprs = for fp, i in fps
          fp / (fp + tns[i])

        scores.columns.push
          name: 'TPR'
          description: 'True Positive Rate'
          format: '%f'
          type: 'double'
        scores.data.push tprs

        scores.columns.push
          name: 'FPR'
          description: 'False Positive Rate'
          format: '%f'
          type: 'double'
        scores.data.push fprs

        scores.columns.push
          name: 'CM'
          description: 'CM'
          format: 'matrix' #TODO HACK
          type: 'matrix'
        scores.data.push cms

        metrics


    ModelMetricsMultinomial:
      fields: null
    ModelMetricsRegression:
      fields: null
    ModelMetricsClustering:
      fields: null
    ModelMetricsAutoEncoder:
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
            inspections[k] = inspectRawArray_ k, origin, k, v
          else if isObject v
            if meta = v.__meta
              if meta.schema_type is 'Key<Frame>'
                record[k] = "<a href='#' data-type='frame' data-key=#{stringify v.name}>#{escape v.name}</a>"
              else if meta.schema_type is 'Key<Model>'
                record[k] = "<a href='#' data-type='model' data-key=#{stringify v.name}>#{escape v.name}</a>"
              else if meta.schema_type is 'Frame'
                record[k] = "<a href='#' data-type='frame' data-key=#{stringify v.key.name}>#{escape v.key.name}</a>"
              else
                inspectObject inspections, "#{name} - #{k}", origin, v
            else
              console.log "WARNING: dropping [#{k}] from inspection:", v
          else
            record[k] = if isNumber v then format6fi v else v

    return

  extendModel = (model) ->
    inspections = {}
    inspections.parameters = inspectModelParameters model

    inspectObject inspections, 'output', "getModel #{stringify model.key.name}", model.output

    inspect_ model, inspections
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

  #TODO obsolete
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

  extendPredictions = (opts, predictions) ->
    render_ predictions, H2O.PredictsOutput, opts, predictions
    predictions

  extendPrediction = (modelKey, frameKey, prediction) ->
    inspections = {}
    inspectObject inspections, 'Prediction', "getPrediction model: #{stringify prediction.model.name}, frame: #{stringify prediction.frame.name}", prediction
    inspect_ prediction, inspections
    render_ prediction, H2O.PredictOutput, prediction

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

    titleOf = (label) ->
      parts = (split label, '|')
      if title = parts[1] then title else parts[0]

    formatAsLink = (label) ->
      "<a href='#' data-type='label' data-key=#{stringify label}>#{escape label}</a>"

    vectors = for name in attrs
      switch name
        when 'min'
          createVector name, TNumber, (head column.mins for column in frameColumns), format4f
        when 'max'
          createVector name, TNumber, (head column.maxs for column in frameColumns), format4f
        when 'cardinality'
          createVector name, TNumber, ((if domain = column.domain then domain.length else undefined) for column in frameColumns)
        when 'label'
          createFactor name, TString, (column[name] for column in frameColumns), null, formatAsLink
        when 'type'
          createFactor name, TString, (column[name] for column in frameColumns)
        when 'mean', 'sigma'
          createVector name, TNumber, (column[name] for column in frameColumns), format4f
        else
          createVector (titleOf name), TNumber, (column[name] for column in frameColumns)
         
    createDataframe tableLabel, vectors, (sequence frameColumns.length), null,
      description: "A list of #{tableLabel} in the H2O Frame."
      origin: "getFrameSummary #{stringify frameKey}"
      plot: "plot inspect '#{tableLabel}', getFrameSummary #{stringify frameKey}"

  inspectFrameData = (frameKey, frame) -> ->
    frameColumns = frame.columns

    vectors = for column in frameColumns
      #XXX format functions
      switch column.type
        when 'int', 'real'
          createVector column.label, TNumber, (parseNaNs column.data), format4f
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

  requestFrameSummary = (frameKey, go) ->
    _.requestFrameSummary frameKey, (error, frame) ->
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
    for part in (sortBy parts, (part) -> part.ratio)
      splits.push
        min: sum
        max: sum + part.ratio
        key: part.key

      sum += part.ratio

    console.log splits
    splits

  requestSplitFrame = (frameKey, splitRatios, splitKeys, go) ->
    if splitRatios.length is splitKeys.length - 1
      splits = computeSplits splitRatios, splitKeys

      frameExpr = JSON.stringify frameKey
      randomVecKey = createTempKey()

      _.requestExec "(= !#{randomVecKey} (h2o.runif #{frameExpr} #-1))", (error, result) ->
        if error
          go error
        else
          exprs = for part, i in splits
            g = if i isnt 0 then "(G %#{randomVecKey} ##{part.min})" else null

            l = if i isnt splits.length - 1 then "(l %#{randomVecKey} ##{part.max})" else null

            sliceExpr = if g and l
              "(& #{g} #{l})"
            else if l
              l
            else
              g

            "(= !#{JSON.stringify part.key} ([ %#{frameExpr} #{sliceExpr} \"null\"))"

          futures = map exprs, (expr) ->
            _fork _.requestExec, expr

          Flow.Async.join futures, (error, results) ->
            if error
              go error
            else
              _.requestDeleteFrame randomVecKey, (error, result) ->
                if error
                  go error
                else
                  go null, extendSplitFrameResult
                    keys: splitKeys
                    ratios: splitRatios

    else
      go new Flow.Error 'The number of split ratios should be one less than the number of split keys'

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

  getFrameSummary = (frameKey) ->
    switch typeOf frameKey
      when 'String'
        _fork requestFrameSummary, frameKey
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
          go null, extendJob result.job


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
    render_ rdds, H2O.RDDsOutput, rdds
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
    result ?= {}
    debug result
    go null, render_ result, Flow.ObjectBrowser, 'dump', result

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
  getFrameSummary: getFrameSummary
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

