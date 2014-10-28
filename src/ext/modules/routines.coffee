renderable = Flow.Async.renderable

Flow.Routines = (_) ->
  bailout = ->
    renderable Flow.Async.noop, (ignore, go) ->
      go null, Flow.NoAssistView _

  gui = Flow.Gui _

  _flowMenuItems =
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

  menu = ->
    getMenu = (go) -> go null, _flowMenuItems
    renderable getMenu, (items, go) ->
      go null, Flow.Menu _, items

  help = ->
    renderable Flow.Async.noop, (ignore, go) ->
      go null, 
        executeHelp: -> _.insertAndExecuteCell 'cs', 'help'
        executeMenu: -> _.insertAndExecuteCell 'cs', 'menu'
        template: 'flow-help'
  

  getFrames = ->
    renderable _.requestFrames, (frames, go) ->
      go null, Flow.FramesOutput _, frames

  getFrame = (key) ->
    switch typeOf key
      when 'String'
        renderable _.requestFrame, key, (frame, go) ->
          go null, Flow.FrameOutput _, frame
      else
        bailout()

  getModels = ->
    renderable _.requestModels, (models, go) ->
      go null, Flow.ModelsOutput _, models

  getModel = (key) ->
    switch typeOf key
      when 'String'
        renderable _.requestModel, key, (model, go) ->
          go null, Flow.ModelOutput _, model
      else
        bailout()

  getJobs = ->
    renderable _.requestJobs, (jobs, go) ->
      go null, Flow.JobsOutput _, jobs    

  getJob = (arg) ->
    switch typeOf arg
      when 'String'
        renderable _.requestJob, arg, (job, go) ->
          go null, Flow.JobOutput _, job
      when 'Object'
        if arg.key?
          getJob arg.key
        else
          bailout()
      else
        bailout()

  importFiles = (paths) ->
    switch typeOf paths
      when 'Array'
        renderable _.requestImportFiles, paths, (importResults, go) ->
          go null, Flow.ImportFilesOutput _, importResults
      else
        renderable Flow.Async.noop, (ignore, go) ->
          go null, Flow.ImportFilesInput _

  setupParse = (sourceKeys) ->
    switch typeOf sourceKeys
      when 'Array'
        renderable _.requestParseSetup, sourceKeys, (parseSetupResults, go) ->
          go null, Flow.SetupParseOutput _, parseSetupResults
      else
        bailout()

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
      go null, Flow.ParseOutput _, parseResult

  buildModel = (algo, opts) ->
    if algo and opts and keys(opts).length > 1
      renderable _.requestModelBuild, algo, opts, (modelBuildResult, go) ->
        go null, Flow.JobOutput _, head modelBuildResult.jobs
    else
      renderable Flow.Async.noop, (ignore, go) ->
        go null, Flow.ModelInput _, algo, opts

  loadScript = (path, go) ->
    onDone = (script, status) -> go null, script:script, status:status
    onFail = (jqxhr, settings, error) -> go error #TODO use framework error

    $.getScript path
      .done onDone
      .fail onFail

  fork: Flow.Async.fork
  join: (args..., go) -> Flow.Async.join args, _applicate go
  call: (go, args...) -> Flow.Async.join args, _applicate go
  apply: (go, args) -> Flow.Async.join args, go
  isFuture: Flow.Async.isFuture
  signal: signal
  signals: signals
  isSignal: isSignal
  act: act
  react: react
  lift: lift
  merge: merge
  menu: menu
  getJobs: getJobs
  getJob: getJob
  importFiles: importFiles
  setupParse: setupParse
  parseRaw: parseRaw
  getFrames: getFrames
  getFrame: getFrame
  buildModel: buildModel
  getModels: getModels
  getModel: getModel
  gui: gui
  loadScript: loadScript
  help: help

