{ slot, signal } = require('../../core/modules/dataflow')

exports.init = (_) ->
  _.requestFileGlob = do slot
  _.requestCreateFrame = do slot
  _.requestSplitFrame = do slot
  _.requestImportFile = do slot
  _.requestImportFiles = do slot
  _.requestImportSqlTable = do slot
  _.requestParseFiles = do slot
  _.requestInspect = do slot
  _.requestParseSetup = do slot
  _.requestParseSetupPreview = do slot
  _.requestFrames = do slot
  _.requestFrame = do slot
  _.requestFrameSlice = do slot
  _.requestFrameSummary = do slot
  _.requestFrameDataE = do slot
  _.requestFrameSummarySlice = do slot
  _.requestFrameSummarySliceE = do slot
  _.requestFrameSummaryWithoutData = do slot
  _.requestDeleteFrame = do slot
  _.requestExportFrame = do slot
  _.requestColumnSummary = do slot
  _.requestModelBuilder = do slot
  _.requestModelBuilders = do slot
  _.requestModelBuild = do slot
  _.requestModelInputValidation = do slot
  _.requestAutoModelBuild = do slot
  _.requestPredict = do slot
  _.requestPrediction = do slot
  _.requestPredictions = do slot
  _.requestPartialDependence = do slot
  _.requestPartialDependenceData = do slot
  _.requestGrids = do slot
  _.requestModels = do slot
  _.requestGrid = do slot
  _.requestLeaderboard = do slot
  _.requestModel = do slot
  _.requestPojoPreview = do slot
  _.requestDeleteModel = do slot
  _.requestImportModel = do slot
  _.requestExportModel = do slot
  _.requestJobs = do slot
  _.requestJob = do slot
  _.requestCancelJob = do slot
  _.requestObjects = do slot
  _.requestObject = do slot
  _.requestObjectExists = do slot
  _.requestDeleteObject = do slot
  _.requestPutObject = do slot
  _.requestUploadObject = do slot
  _.requestUploadFile = do slot
  _.requestCloud = do slot
  _.requestTimeline = do slot
  _.requestProfile = do slot
  _.requestStackTrace = do slot
  _.requestRemoveAll = do slot
  _.requestEcho = do slot
  _.requestLogFile = do slot
  _.requestNetworkTest = do slot
  _.requestAbout = do slot
  _.requestShutdown = do slot
  _.requestEndpoints = do slot
  _.requestEndpoint = do slot
  _.requestSchemas = do slot
  _.requestSchema = do slot
  _.requestPacks = do slot
  _.requestPack = do slot
  _.requestFlow = do slot
  _.requestHelpIndex = do slot
  _.requestHelpContent = do slot
  _.requestExec = do slot
  _.ls = do slot
  _.inspect = do slot
  _.plot = do slot
  _.plotlyPlot = do slot
  _.grid = do slot
  _.enumerate = do slot
  #
  # Sparkling-Water
  _.scalaIntpId = signal -1
  _.scalaIntpAsync = signal false
  _.requestRDDs = do slot
  _.requestDataFrames = do slot
  _.requestScalaIntp = do slot
  _.requestScalaCode = do slot
  _.requestAsH2OFrameFromRDD = do slot
  _.requestAsH2OFrameFromDF = do slot
  _.requestAsDataFrame = do slot
  _.requestScalaCodeExecutionResult = do slot
