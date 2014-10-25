Flow.ApplicationContext = (_) ->
  board
    ready: do slots
    requestFileGlob: do slot
    requestImportFiles: do slot
    requestParseFiles: do slot
    requestInspect: do slot
    requestParseSetup: do slot
    requestFrames: do slot
    requestFrame: do slot
    requestColumnSummary: do slot
    requestModelBuilders: do slot
    requestModelBuild: do slot
    requestModelMetrics: do slot
    requestModels: do slot
    requestModel: do slot
    requestJobs: do slot
    requestJob: do slot
    selectCell: do slot
    insertAndExecuteCell: do slot

