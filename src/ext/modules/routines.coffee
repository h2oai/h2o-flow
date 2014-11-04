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
    icon: 'bolt'
  buildModel:
    description: 'Build a model'
    icon: 'cube'

H2O.Routines = (_) ->

  renderable = Flow.Async.renderable
  asynchronize = (f, args..., go) -> go null, apply f, null, args

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

  mixin = (raw, _tableReaders) ->
    raw.getData = (id) ->
      if id
        if read = _tableReaders[id]
          read()
        else
          undefined
      else
        (read() for name, read of _tableReaders)
    raw

  scanTable = (id, obj) ->
    if obj.isFuture
      renderable asynchronize, scanTable, id, obj, (table, go) ->
        if table
          go null, H2O.DataTableOutput _, table
        else
          go new Flow.Error "scan() failed: data '#{id}' not found."
    else
      if obj.getData
        obj.getData id
      else
        undefined

  scanTables = (obj) ->
    if obj.isFuture
      renderable asynchronize, scanTables, obj, (tables, go) ->
        if tables
          go null, H2O.DataTablesOutput _, tables
        else
          go new Error "scan() failed: no data found."
    else
      if obj.getData
        obj.getData()
      else
        undefined

  scan = (arg1, arg2) ->
    switch arguments.length
      when 2
        if (isString arg1) and isObject arg2
          scanTable arg1, arg2
        else
          undefined
      when 1
        if isObject arg1
          scanTables arg1 
        else
          undefined
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
      if config.data.isFuture
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

  extensionSchemaConfig =
    column:
      integerHistogram: [
        [ 'intervalStart', Flow.Data.Integer ]
        [ 'intervalEnd', Flow.Data.Integer ]
        [ 'count', Flow.Data.Integer ]
      ]
      realHistogram: [
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
        #[ 'mins', Flow.Data.RealArray ] # Show 1 min
        #[ 'maxs', Flow.Data.RealArray ] # Show 1 max
        [ 'mean', Flow.Data.Real ]
        [ 'sigma', Flow.Data.Real ]
        [ 'type', Flow.Data.String ]
        #[ 'domain', Flow.Data.Array ]
        #[ 'data', Flow.Data.Array ]
        #[ 'str_data', Flow.Data.Array ]
        [ 'precision', Flow.Data.Real ]
        #[ 'pctiles', Flow.Data.RealArray ] #XXX ???
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

  extendFrame = (frameKey, frame) ->
    __getColumns = null
    getColumns = ->
      return __getColumns if __getColumns

      schema = extensionSchemas.frame.columns
      Row = Flow.Data.createCompiledPrototype schema.attributeNames
      rows = for column in frame.columns
        row = new Row()
        row[attr] = column[attr] for attr in schema.attributeNames
        row

      __getColumns = Flow.Data.Table
        name: 'columns'
        label: 'Columns'
        description: 'A list of columns in the H2O Frame.'
        columns: schema.attributes
        rows: rows
        meta:
          scan: "scan 'columns', getFrame #{stringify frameKey}"

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
            type: Flow.Data.StringEnum
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
            when Flow.Data.Integer
              #TODO handle +-Inf
              row[column.name] = if value is 'NaN' then null else value
            when Flow.Data.Real
              #TODO handle +-Inf
              row[column.name] = if value is 'NaN' then null else value
            when Flow.Data.StringEnum
              row[column.name] = column.domain[value]
            when Flow.Data.String
              row[column.name] = value
            when Flow.Data.Date
              row[column.name] = value
        row
      
      __getData = Flow.Data.Table
        name: 'data'
        label: 'Data'
        description: 'A partial list of rows in the H2O Frame.'
        columns: columns
        rows: rows
        meta:
          scan: "scan 'data', getFrame #{stringify frameKey}"

    __getMins = null

    __getMaxs = null

    mixin frame,
      columns: getColumns
      data: getData

  extendColumnSummary = (frameKey, frame) ->
    __getHistogram = null
    getHistogram = ->
      return __getHistogram if __getHistogram

      column = head frame.columns
      histogramDataType = if column.type is 'int' then Flow.Data.Integer else Flow.Data.Real
      
      schema = if column.type is 'int' then extensionSchemas.column.integerHistogram else extensionSchemas.column.realHistogram
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

      __getHistogram = Flow.Data.Table
        name: 'histogram'
        label: 'Histogram'
        description: "Histogram for column '#{column.label}' in frame '#{frameKey}'."
        columns: schema.attributes
        rows: rows

    mixin frame,
      histogram: getHistogram

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
        go null, extendColumnSummary frameKey, frame

  getFrames = ->
    renderable _.requestFrames, (frames, go) ->
      go null, H2O.FramesOutput _, frames

  getFrame = (frameKey) ->
    switch typeOf frameKey
      when 'String'
        renderable requestFrame, frameKey, (frame, go) ->
          go null, H2O.FrameOutput _, frame
      else
        assist getFrame

  getColumnSummary = (frameKey, columnName) ->
    renderable requestColumnSummary, frameKey, columnName, (frame, go) ->
      go null, H2O.ColumnSummaryOutput _, frameKey, frame

  getModels = ->
    renderable _.requestModels, (models, go) ->
      go null, H2O.ModelsOutput _, models

  getModel = (modelKey) ->
    switch typeOf modelKey
      when 'String'
        renderable _.requestModel, modelKey, (model, go) ->
          go null, H2O.ModelOutput _, model
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
        else
          proceed H2O.NoAssistView


  link _.ready, ->
    link _.scan, scan

  # fork/join 
  fork: (f, args...) -> Flow.Async.fork f, args
  join: (args..., go) -> Flow.Async.join args, _applicate go
  call: (go, args...) -> Flow.Async.join args, _applicate go
  apply: (go, args) -> Flow.Async.join args, go
  isFuture: Flow.Async.isFuture
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
  scan: scan
  plot: plot
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

