Flow.Routines = (_) ->

  renderJobs = (jobs, go) ->
    go null, Flow.JobsOutput _, jobs    

  renderJob = (job, go) ->
    go null, Flow.JobOutput _, job

  renderImportFiles = (importResults, go) ->
    go null, Flow.ImportFilesOutput _, importResults

  renderSetupParse = (parseSetupResults, go) ->
    go null, Flow.SetupParseOutput _, parseSetupResults

  renderParse = (parseResult, go) ->
    go null, Flow.ParseOutput _, parseResult

  renderFrames = (frames, go) ->
    go null, Flow.FramesOutput _, frames

  renderFrame = (frame, go) ->
    go null, Flow.FrameOutput _, frame

  renderBuildModel = (modelBuildResult, go) ->
    go null, Flow.JobOutput _, head modelBuildResult.jobs

  renderModels = (models, go) ->
    go null, Flow.ModelsOutput _, models

  renderModel = (model, go) ->
    go null, Flow.ModelOutput _, model

  renderMenu = (items, go) ->
    go null, Flow.Menu _, items

  getFrames = (arg) ->
    Flow.Async.renderable _.requestFrames, renderFrames

  getFrame = (key) ->
    Flow.Async.renderable _.requestFrame, key, renderFrame

  getModels = (arg) ->
    Flow.Async.renderable _.requestModels, renderModels

  getModel = (key) ->
    Flow.Async.renderable _.requestModel, key, renderModel

  getJobs = ->
    Flow.Async.renderable _.requestJobs, renderJobs

  getJob = (arg) ->
    #XXX validation
    switch typeOf arg
      when 'String'
        Flow.Async.renderable _.requestJob, arg, renderJob
      when 'Object'
        if arg.key?
          job arg.key
        else
          #XXX print usage
          throw new Error 'ni'
      else
        #XXX print usage
        throw new Error 'ni'

  gui = Flow.Gui _

  help = ->
    Flow.Async.renderable Flow.Async.noop, (ignore, go) ->
      go null, 
        executeHelp: -> _.insertAndExecuteCell 'cs', 'help'
        executeMenu: -> _.insertAndExecuteCell 'cs', 'menu'
        template: 'flow-help'
  
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
    Flow.Async.renderable getMenu, renderMenu

  importFiles = (paths) ->
    #XXX validation
    Flow.Async.renderable _.requestImportFiles, paths, renderImportFiles

  setupParse = (sourceKeys) ->
    #XXX validation
    Flow.Async.renderable _.requestParseSetup, sourceKeys, renderSetupParse

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

    Flow.Async.renderable _.requestParseFiles, sourceKeys, destinationKey, parserType, separator, columnCount, useSingleQuotes, columnNames, deleteOnDone, checkHeader, renderParse

  buildModel = (algo, opts) ->
    if algo and opts and keys(opts).length > 1
      Flow.Async.renderable _.requestModelBuild, algo, opts, renderBuildModel
    else
      Flow.Async.renderable Flow.Async.noop, (ignore, go) ->
        go null, Flow.ModelInput _, algo, opts

  ###
  getUsageForFunction = (f) ->
    switch f
      when help
        name: 'help'
        examples: []
        description: 'Display help on a topic or function.'
        syntax: [
          'help topic'
          'help function'
        ]
        parameters: [
          'rgb': 'Number: foo'
        ]
        returns: 'HelpTopic: The help topic'
        related: null
      when jobs

      when job

      else
        null

  help = (arg) ->
    switch typeOf arg
      when 'undefined'

      when 'String'

      when 'Function'

      else
  ###

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

