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
  getJobs:
    description: 'Get a list of jobs running in H<sub>2</sub>O'
    icon: 'tasks'
  buildModel:
    description: 'Build a model'
    icon: 'cube'

H2O.Routines = (_) ->

  #TODO move these into Flow.Async
  _fork = (f, args...) -> Flow.Async.fork f, args
  _join = (args..., go) -> Flow.Async.join args, Flow.Async.applicate go
  _call = (go, args...) -> Flow.Async.join args, Flow.Async.applicate go
  _apply = (go, args) -> Flow.Async.join args, go
  _isFuture = Flow.Async.isFuture
  _async = Flow.Async.async
  _find = Flow.Async.find

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

  render_ = (raw, render) ->
    raw._flow_ = {} unless raw._flow_
    raw._flow_.render = render
    raw

  inspect_ = (raw, _inspections) ->
    __tables = null
    raw._flow_ = {} unless raw._flow_
    raw._flow_.inspect = ->
      return __tables if __tables
      tables = (action() for name, action of _inspections)
      forEach tables, (table) ->
        render_ table, -> H2O.InspectOutput _, table
      render_ tables, -> H2O.InspectsOutput _, tables
      __tables = tables
    raw

  inspect = (obj) ->
    if _isFuture obj
      _async inspect, obj
    else
      if obj._flow_?.inspect
        obj._flow_.inspect()
      else
        undefined

  __plot = (config, go) ->
    Flow.Plot config, (error, plot) ->
      if error
        go new Flow.Error 'Error rendering plot.', error
      else
        go null, plot

  _plot = (config, go) ->
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

  plot = (config) ->
    renderable _plot, config, (plot, go) ->
      go null, H2O.PlotOutput _, plot

  plot.stack = Flow.Plot.stack

  grid = (data) ->
    plot
      type: 'text'
      data: data

  extensionSchemaConfig =
    column:
      integerDistribution: [
        [ 'intervalStart', Flow.Data.Integer ]
        [ 'intervalEnd', Flow.Data.Integer ]
        [ 'count', Flow.Data.Integer ]
      ]
      realDistribution: [
        [ 'intervalStart', Flow.Data.Real ]
        [ 'intervalEnd', Flow.Data.Real ]
        [ 'count', Flow.Data.Integer ]
      ]
    frame:
      columns: [
        [ 'label', Flow.Data.String ]
        [ 'missing', Flow.Data.Integer ]
        [ 'zeros', Flow.Data.Integer ]
        [ 'pinfs', Flow.Data.Integer ]
        [ 'ninfs', Flow.Data.Integer ]
        [ 'min', Flow.Data.Real ]
        [ 'max', Flow.Data.Real ]
        [ 'mean', Flow.Data.Real ]
        [ 'sigma', Flow.Data.Real ]
        [ 'type', Flow.Data.String ]
        [ 'domain', Flow.Data.Integer ]
        #[ 'data', Flow.Data.Array ]
        #[ 'str_data', Flow.Data.Array ]
        [ 'precision', Flow.Data.Real ]
      ]

  extensionSchemas = {}
  for groupName, group of extensionSchemaConfig
    extensionSchemas[groupName] = schemas = {}
    for schemaName, tuples of group
      attributes = for tuple in tuples
        [ name, type ] = tuple
        name: name
        type: type

      schemas[schemaName] =
        attributes: attributes
        attributeNames: map attributes, (attribute) -> attribute.name

  extendFrames = (frames) ->
    render_ frames, -> H2O.FramesOutput _, frames
    frames

  getMultiModelParameters = (models) -> ->
    leader = head models
    parameters = leader.parameters
    columns = for parameter in parameters
      switch parameter.type
        when 'enum', 'Frame', 'string', 'byte[]', 'short[]', 'int[]', 'long[]', 'float[]', 'double[]'
          read = Flow.Data.Factor()
          createColumn parameter.label, Flow.Data.Enum, read.domain, read
        when 'byte', 'short', 'int', 'long', 'float', 'double'
          createColumn parameter.label, Flow.Data.Real
        when 'string[]'
          createColumn parameter.label, Flow.Data.Array
        when 'boolean'
          createColumn parameter.label, Flow.Data.Boolean
        else
          createColumn parameter.label, Flow.Data.Object

    Row = Flow.Data.compile columns

    rows = new Array models.length
    for model, i in models
      rows[i] = row = new Row()
      for parameter, j in parameters
        column = columns[j]
        row[column.name] = if column.type is Flow.Data.Enum
          column.read parameter.actual_value
        else
          parameter.actual_value

    modelKeys = (model.key for model in models)

    Flow.Data.Table
      name: 'parameters'
      description: "Parameters for models #{modelKeys.join ', '}"
      columns: columns
      rows: rows
      meta:
        inspect: "find 'parameters', inspect getModels #{stringify modelKeys}"

  getModelParameters = (model) -> ->
    parameters = model.parameters
    columns = [
      createColumn 'label', Flow.Data.String
      createColumn 'type', Flow.Data.String
      createColumn 'level', Flow.Data.String
      createColumn 'actual_value', Flow.Data.Object
      createColumn 'default_value', Flow.Data.Object
    ]

    Row = Flow.Data.compile columns
    rows = new Array parameters.length
    for parameter, i in parameters
      rows[i] = row = new Row()
      for column in columns
        row[column.name] = parameter[column.name]

    Flow.Data.Table
      name: 'parameters'
      description: "Parameters for model '#{model.key}'" #TODO frame key
      columns: columns
      rows: rows
      meta:
        inspect: "find 'parameters', inspect getModel #{stringify model.key}"

  extendKMeansModel = (model) ->
    inspect_ model,
      parameters: getModelParameters model

  extendDeepLearningModel = (model) ->
    inspect_ model,
      parameters: getModelParameters model
  
  extendGLMModel = (model) ->
    inspect_ model,
      parameters: getModelParameters model

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
        parameters: getMultiModelParameters models 

    render_ models, -> H2O.ModelsOutput _, models

  computeTruePositiveRate = (cm) ->
    [[tn, fp], [fn, tp]] = cm
    tp / (tp + fn)
    
  computeFalsePositiveRate = (cm) ->
    [[tn, fp], [fn, tp]] = cm
    fp / (fp + tn)

  createColumn = (name, type, domain, read, write) ->
    name: name
    type: type
    domain: domain or null
    read: read or null
    write: write or null

  #XXX obsolete
  createNumberColumn = (name, domain) ->
    name: name
    type: Flow.Data.Real
    domain: domain or null

  #XXX obsolete
  createEnumColumn = (name, domain) ->
    name: name
    type: Flow.Data.Enum
    domain: domain or null

  #XXX obsolete
  createObjectColumn = (name) ->
    name: name
    type: Flow.Data.Object

  read = (value) -> if value is 'NaN' then null else value

  extendModelMetrics = (modelMetrics) ->
    { frame, model, auc } = modelMetrics
#threshold_criterion scalar
#AUC scalar
#Gini scalar

#actual_domain 2

    getScores = ->
      columns = [
        thresholdsColumn = createNumberColumn 'threshold'
        f1Column = createNumberColumn 'F1'
        f2Column = createNumberColumn 'F2'
        f05Column = createNumberColumn 'F0point5'
        accuracyColumn = createNumberColumn 'accuracy'
        errorColumn = createNumberColumn 'errorr'
        precisionColumn = createNumberColumn 'precision'
        recallColumn = createNumberColumn 'recall'
        specificityColumn = createNumberColumn 'specificity'
        mccColumn = createNumberColumn 'mcc'
        mpceColumn = createNumberColumn 'max_per_class_error'
        cmColumn = createObjectColumn 'confusion_matrices'
        tprColumn = createNumberColumn 'TPR'
        fprColumn = createNumberColumn 'FPR'
      ]

      Row = Flow.Data.createCompiledPrototype (column.name for column in columns)
      rows = for i in [ 0 ... auc.thresholds.length ]
        row = new Row()
        row.threshold = read auc.thresholds[i]
        row.F1 = read auc.F1[i]
        row.F2 = read auc.F2[i]
        row.F0point5 = read auc.F0point5[i]
        row.accuracy = read auc.accuracy[i]
        row.errorr = read auc.errorr[i]
        row.precision = read auc.precision[i]
        row.recall = read auc.recall[i]
        row.specificity = read auc.specificity[i]
        row.mcc = read auc.mcc[i]
        row.max_per_class_error = read auc.max_per_class_error[i]
        row.confusion_matrices = cm = auc.confusion_matrices[i]
        row.TPR = computeTruePositiveRate cm
        row.FPR = computeFalsePositiveRate cm
        row

      Flow.Data.Table
        name: 'metrics'
        description: "Metrics for model '#{model.key}' on frame '#{frame.key.name}'"
        columns: columns
        rows: rows
        meta:
          inspect: "find 'metrics', inspect predict #{stringify model.key}, #{stringify frame.key.name}"

    getMetrics = ->
      
      [ criteriaDomain, criteriaData ] = Flow.Data.factor auc.threshold_criteria

      columns = [
        criteriaColumn = createEnumColumn 'criteria', criteriaDomain
        thresholdColumn = createNumberColumn 'threshold'
        f1Column = createNumberColumn 'F1'
        f2Column = createNumberColumn 'F2'
        f05Column = createNumberColumn 'F0point5'
        accuracyColumn = createNumberColumn 'accuracy'
        errorColumn = createNumberColumn 'error'
        precisionColumn = createNumberColumn 'precision'
        recallColumn = createNumberColumn 'recall'
        specificityColumn = createNumberColumn 'specificity'
        mccColumn = createNumberColumn 'mcc'
        mpceColumn = createNumberColumn 'max_per_class_error'
        cmColumn = createObjectColumn 'confusion_matrix' 
        tprColumn = createNumberColumn 'TPR'
        fprColumn = createNumberColumn 'FPR'
      ]

      Row = Flow.Data.createCompiledPrototype (column.name for column in columns)
      rows = for i in [ 0 ... auc.threshold_criteria.length ]
        row = new Row()
        row.criteria = criteriaData[i]
        row.threshold = read auc.threshold_for_criteria[i]
        row.F1 = read auc.F1_for_criteria[i]
        row.F2 = read auc.F2_for_criteria[i]
        row.F0point5 = read auc.F0point5_for_criteria[i]
        row.accuracy = read auc.accuracy_for_criteria[i]
        row.error = read auc.error_for_criteria[i]
        row.precision = read auc.precision_for_criteria[i]
        row.recall = read auc.recall_for_criteria[i]
        row.specificity = read auc.specificity_for_criteria[i]
        row.mcc = read auc.mcc_for_criteria[i]
        row.max_per_class_error = read auc.max_per_class_error_for_criteria[i]
        row.confusion_matrix = cm = auc.confusion_matrix_for_criteria[i] 
        row.TPR = computeTruePositiveRate cm
        row.FPR = computeFalsePositiveRate cm
        row

      Flow.Data.Table
        name: 'scores'
        description: "Scores for model '#{modelMetrics.model.key}' on frame '#{modelMetrics.frame.key.name}'"
        columns: columns
        rows: rows
        meta:
          inspect: "find 'scores', inspect predict #{stringify model.key}, #{stringify frame.key.name}"
    
    render_ modelMetrics, -> H2O.PredictOutput _, modelMetrics
    inspect_ modelMetrics,
      scores: getScores
      metrics: getMetrics

  extendFrame = (frameKey, frame) ->
    __getColumns = null
    getColumns = ->
      return __getColumns if __getColumns

      schema = extensionSchemas.frame.columns
      Row = Flow.Data.createCompiledPrototype schema.attributeNames
      rows = for column in frame.columns
        row = new Row()
        for attr in schema.attributeNames
          switch attr
            when 'min'
              row[attr] = head column.mins
            when 'max'
              row[attr] = head column.maxs
            when 'domain'
              row[attr] = if domain = column[attr] then domain.length else null
            else
              row[attr] = column[attr] 
        row

      __getColumns = Flow.Data.Table
        name: 'columns'
        description: 'A list of columns in the H2O Frame.'
        columns: schema.attributes
        rows: rows
        meta:
          inspect: "find 'columns', inspect getFrame #{stringify frameKey}"

    __getData = null
    getData = ->
      return __getData if __getData

      frameColumns = frame.columns
      columns = for column in frameColumns
        #XXX format functions
        switch column.type
          when 'int'
            name: column.label
            type: Flow.Data.Integer
          when 'real'
            name: column.label
            type: Flow.Data.Real
          when 'enum'
            name: column.label
            type: Flow.Data.Enum
            domain: column.domain
          when 'uuid', 'string'
            name: column.label
            type: Flow.Data.String
          when 'time'
            name: column.label
            type: Flow.Data.Date
          else
            throw new Error "Invalid column type #{column.type} found in frame #{frameKey}."
      columnNames = (column.name for column in columns)
      Row = Flow.Data.createCompiledPrototype columnNames
      rowCount = (head frame.columns).data.length
      rows = for i in [0 ... rowCount]
        row = new Row()
        for column, j in columns
          value = frameColumns[j].data[i]
          switch column.type
            when Flow.Data.Integer, Flow.Data.Real
              #TODO handle +-Inf
              row[column.name] = if value is 'NaN' then null else value
            else
              row[column.name] = value
        row
      
      __getData = Flow.Data.Table
        name: 'data'
        description: 'A partial list of rows in the H2O Frame.'
        columns: columns
        rows: rows
        meta:
          inspect: "find 'data', inspect getFrame #{stringify frameKey}"

    __getMins = null

    __getMaxs = null

    inspect_ frame,
      columns: getColumns
      data: getData

  extendColumnSummary = (frameKey, frame, columnName) ->
    column = head frame.columns
    rowCount = frame.rows

    __getPercentiles = null
    getPercentiles = ->
      return __getPercentiles if __getPercentiles
      
      percentiles = frame.default_pctiles
      percentileValues = column.pctiles

      columns = [
        name: 'percentile'
        type: Flow.Data.Real
      ,
        name: 'value'
        type: Flow.Data.Real #TODO depends on type of column?
      ]

      Row = Flow.Data.createCompiledPrototype map columns, (column) -> column.name
      rows = for percentile, i in percentiles
        row = new Row()
        row.percentile = percentile
        row.value = percentileValues[i]
        row

      __getPercentiles = Flow.Data.Table
        name: 'percentiles'
        description: "Percentiles for column '#{column.label}' in frame '#{frameKey}'."
        columns: columns
        rows: rows
        meta:
          inspect: "find 'percentiles', inspect getColumnSummary #{stringify frameKey}, #{stringify columnName}"


    __getDistribution = null
    getDistribution = ->
      return __getDistribution if __getDistribution

      distributionDataType = if column.type is 'int' then Flow.Data.Integer else Flow.Data.Real
      
      schema = if column.type is 'int' then extensionSchemas.column.integerDistribution else extensionSchemas.column.realDistribution
      Row = Flow.Data.createCompiledPrototype schema.attributeNames
      
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

          row = new Row()
          row.intervalStart = base + i * interval
          row.intervalEnd = row.intervalStart + interval
          row.count = count
          rows.push row
      else
        for count, i in bins
          row = new Row()
          row.intervalStart = base + i * stride
          row.intervalEnd = row.intervalStart + stride
          row.count = count
          rows.push row

      __getDistribution = Flow.Data.Table
        name: 'distribution'
        description: "Distribution for column '#{column.label}' in frame '#{frameKey}'."
        columns: schema.attributes
        rows: rows
        meta:
          inspect: "find 'distribution', inspect getColumnSummary #{stringify frameKey}, #{stringify columnName}"

    __getCharacteristics = null
    getCharacteristics = ->
      return __getCharacteristics if __getCharacteristics

      { missing, zeros, pinfs, ninfs } = column
      other = rowCount - missing - zeros - pinfs - ninfs

      [ domain, characteristics ] = Flow.Data.factor [ 'Missing', '-Inf', 'Zero', '+Inf', 'Other' ]

      columns = [
        name: 'characteristic'
        type: Flow.Data.Enum
        domain: domain
      ,
        name: 'count'
        type: Flow.Data.Integer
        domain: [ 0, rowCount ]
      ,
        name: 'percent'
        type: Flow.Data.Real
        domain: [ 0, 100 ]
      ]

      rows = for count, i in [ missing, ninfs, zeros, pinfs, other ]
        characteristic: characteristics[i]
        count: count
        percent: 100 * count / rowCount

      __getCharacteristics = Flow.Data.Table
        name: 'characteristics'
        description: "Characteristics for column '#{column.label}' in frame '#{frameKey}'."
        columns: columns
        rows: rows
        meta:
          inspect: "find 'characteristics', inspect getColumnSummary #{stringify frameKey}, #{stringify columnName}"
          plot: """
          plot
            title: 'Characteristics for #{frameKey} : #{column.label}'
            type: 'interval'
            data: find 'characteristics', inspect getColumnSummary #{stringify frameKey}, #{stringify columnName}
            x: plot.stack 'count'
            color: 'characteristic'
          """

    __getSummary = null
    getSummary = ->
      return __getSummary if __getSummary

      columns = [
        name: 'mean'
        type: Flow.Data.Real
      ,
        name: 'q1'
        type: Flow.Data.Real
      ,
        name: 'q2'
        type: Flow.Data.Real
      ,
        name: 'q3'
        type: Flow.Data.Real
      ,
        name: 'outliers'
        type: Flow.Data.Array
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

      __getSummary = Flow.Data.Table
        name: 'summary'
        description: "Summary for column '#{column.label}' in frame '#{frameKey}'."
        columns: columns
        rows: [ row ]
        meta:
          inspect: "find 'summary', inspect getColumnSummary #{stringify frameKey}, #{stringify columnName}"

    __getDomain = null
    getDomain = ->
      return __getDomain if __getDomain

      levels = map column.bins, (count, index) -> count: count, index: index

      #TODO sort table in-place when sorting is implemented
      sortedLevels = sortBy levels, (level) -> -level.count

      labelColumn = 
        name: 'label'
        type: Flow.Data.Enum
        domain: column.domain
      countColumn = 
        name: 'count'
        type: Flow.Data.Integer
        domain: null
      percentColumn =
        name: 'percent'
        type: Flow.Data.Real
        domain: [ 0, 100 ]

      columns = [ labelColumn, countColumn, percentColumn ]

      Row = Flow.Data.createCompiledPrototype map columns, (column) -> column.name
      rows = for level in sortedLevels
        row = new Row()
        row.label = level.index
        row.count = level.count
        row.percent = 100 * level.count / rowCount
        row

      countColumn.domain = Flow.Data.computeRange rows, 'count'
      
      __getDomain = Flow.Data.Table
        name: 'domain'
        description: "Domain for column '#{column.label}' in frame '#{frameKey}'."
        columns: columns
        rows: rows
        meta:
          inspect: "find 'domain', inspect getColumnSummary #{stringify frameKey}, #{stringify columnName}"
          plot: """
          plot
            title: 'Domain for #{frameKey} : #{column.label}'
            type: 'interval'
            data: find 'domain', inspect getColumnSummary #{stringify frameKey}, #{stringify columnName}
            x: 'count'
            y: 'label'
          """

    switch column.type
      when 'int', 'real'
        inspect_ frame,
          characteristics: getCharacteristics
          summary: getSummary
          distribution: getDistribution
          percentiles: getPercentiles
      else
        inspect_ frame,
          characteristics: getCharacteristics
          domain: getDomain
          percentiles: getPercentiles


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
    futures = for key in modelKeys
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
    _.requestPredict modelKey, frameKey, (error, metrics) ->
      if error
        go error
      else
        go null, extendModelMetrics metrics

  requestModelMetrics = (modelKey, frameKey, go) ->
    _.requestModelMetrics modelKey, frameKey, (error, metrics) ->
      if error
        go error
      else
        go null, extendModelMetrics metrics

  predict = (modelKey, frameKey) ->
    if modelKey and frameKey
      _fork requestPredict, modelKey, frameKey
    else
      assist predict, modelKey, frameKey

  getPrediction = (modelKey, frameKey) -> #XXX not exposed
    if modelKey and frameKey
      _fork requestModelMetrics, modelKey, frameKey
    else
      assist requestModelMetrics, modelKey, frameKey

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
        when predict
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
  find: _find
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

