{ isArray, map, filter, head } = require('lodash')
{ isObject, isNumber } = require('../../core/modules/prelude')

{ lift, link, signal, signals } = require("../../core/modules/dataflow")
{ stringify } = require('../../core/modules/prelude')
{ iterate } = require('../../core/modules/async')
JSONbig = require('json-bigint')
FlowError = require('../../core/modules/flow-error')
util = require('./util')

exports.init = (_) ->

  download = (type, url, go) ->
    if url.substring(0,1) == "/"
        url = _.ContextPath + url.substring(1)
    $.ajax
      dataType: type
      url: url
      success: (data, status, xhr) -> go null, data
      error: (xhr, status, error) -> go new FlowError error

  optsToString = (opts) ->
    if opts?
      str = " with opts #{ stringify opts }"
      if str.length > 50
        "#{ str.substr 0, 50 }..."
      else
        str
    else
      ''

  $.ajaxSetup converters: { "text json": JSONbig.parse }

  http = (method, path, opts, go) ->
    if path.substring(0,1) == "/"
      path = _.ContextPath + path.substring(1)

    _.status 'server', 'request', path

    trackPath path

    req = switch method
      when 'GET'
        $.getJSON path
      when 'POST'
        $.post path, opts
      when 'POSTJSON'
        $.ajax
          url: path
          type: 'POST'
          contentType: 'application/json'
          cache: no
          data: stringify opts
      when 'PUT'
        $.ajax url: path, type: method, data: opts
      when 'DELETE'
        $.ajax url: path, type: method
      when 'UPLOAD'
        $.ajax
          url: path
          type: 'POST'
          data: opts
          cache: no
          contentType: no
          processData: no

    req.done (data, status, xhr) ->
      _.status 'server', 'response', path

      try
        go null, data
      catch error
        console.debug(error)
        go new FlowError "Error processing #{method} #{path}", error

    req.fail (xhr, status, error) ->
      _.status 'server', 'error', path

      response = xhr.responseJSON

      cause = if (meta = response?.__meta) and (meta.schema_type is 'H2OError' or meta.schema_type is 'H2OModelBuilderError')
        serverError = new FlowError response.exception_msg
        serverError.stack = "#{response.dev_msg} (#{response.exception_type})" + "\n  " + response.stacktrace.join "\n  "
        serverError
      else if error?.message
        new FlowError error.message
      else
        # special-case net::ERR_CONNECTION_REFUSED
        if status is 'error' and xhr.status is 0
          new FlowError "Could not connect to H2O. Your H2O cloud is currently unresponsive."
        else
          new FlowError "HTTP connection failure: status=#{status}, code=#{xhr.status}, error=#{error or '?'}"

      go new FlowError "Error calling #{method} #{path}#{optsToString opts}", cause

  doGet = (path, go) -> http 'GET', path, null, go
  doPost = (path, opts, go) -> http 'POST', path, opts, go
  doPostJSON = (path, opts, go) -> http 'POSTJSON', path, opts, go
  doPut = (path, opts, go) -> http 'PUT', path, opts, go
  doUpload = (path, formData, go) -> http 'UPLOAD', path, formData, go
  doDelete = (path, go) -> http 'DELETE', path, null, go

  trackPath = (path) ->
    try
      [ root, version, name ] = path.split '/'
      [ base, other ] = name.split '?'
      if base isnt 'Typeahead' and base isnt 'Jobs'
        _.trackEvent 'api', base, version
    catch e

    return

  mapWithKey = (obj, f) ->
    result = []
    for key, value of obj
      result.push f value, key
    result

  composePath = (path, opts) ->
    if opts
      params = mapWithKey opts, (v, k) -> "#{k}=#{v}"
      path + '?' + params.join '&'
    else
      path

  requestWithOpts = (path, opts, go) ->
    doGet (composePath path, opts), go

  encodeArrayForPost = (array) ->
    if array
      if array.length is 0
        null
      else
        mappedArray = map array, (element) ->
          if isNumber element
            return element
          if isObject element
            return stringify element
          return "\"#{element}\""
        "[#{mappedArray.join ','}]"
    else
      null

  encodeObject = (source) ->
    target = {}
    for k, v of source
      target[k] = encodeURIComponent v
    target

  encodeObjectForPost = (source) ->
    target = {}
    for k, v of source
      target[k] = if isArray v then encodeArrayForPost v else v
    target

  unwrap = (go, transform) ->
    (error, result) ->
      if error
        go error
      else
        go null, transform result

  requestExec = (ast, go) ->
    doPost '/99/Rapids', { ast: ast }, (error, result) ->
      if error
        go error
      else
        #TODO HACK - this api returns a 200 OK on failures
        if result.error
          go new FlowError result.error
        else
          go null, result

  requestInspect = (key, go) ->
    opts = key: encodeURIComponent key
    requestWithOpts '/3/Inspect', opts, go

  requestCreateFrame = (opts, go) ->
    doPost '/3/CreateFrame', opts, go

  requestSplitFrame = (frameKey, splitRatios, splitKeys, go) ->
    opts =
      dataset: frameKey
      ratios: encodeArrayForPost splitRatios
      dest_keys: encodeArrayForPost splitKeys
    doPost '/3/SplitFrame', opts, go

  requestFrames = (go) ->
    doGet '/3/Frames', (error, result) ->
      if error
        go error
      else
        go null, result.frames

  requestFrame = (key, go, opts) ->
    requestWithOpts "/3/Frames/#{encodeURIComponent key}", opts, (error, result) ->
      if error
        go error
      else
        go null, head result.frames

  requestFrameSlice = (key, searchTerm, offset, count, go) ->
    #TODO send search term
    doGet "/3/Frames/#{encodeURIComponent key}?column_offset=#{offset}&column_count=#{count}", unwrap go, (result) -> head result.frames

  requestFrameSummary = (key, go) ->
    doGet "/3/Frames/#{encodeURIComponent key}/summary", unwrap go, (result) -> head result.frames

  requestFrameSummarySlice = (key, searchTerm, offset, count, go) ->
    #TODO send search term
    doGet "/3/Frames/#{encodeURIComponent key}/summary?column_offset=#{offset}&column_count=#{count}&_exclude_fields=frames/columns/data,frames/columns/domain,frames/columns/histogram_bins,frames/columns/percentiles", unwrap go, (result) -> head result.frames

  requestFrameSummaryWithoutData = (key, go) ->
    doGet "/3/Frames/#{encodeURIComponent key}/summary?_exclude_fields=frames/chunk_summary,frames/distribution_summary,frames/columns/data,frames/columns/domain,frames/columns/histogram_bins,frames/columns/percentiles", (error, result) ->
      if error
        go error
      else
        go null, head result.frames

  requestDeleteFrame = (key, go) ->
    doDelete "/3/Frames/#{encodeURIComponent key}", go

  requestExportFrame = (key, path, overwrite, go) ->
    params =
      path: path
      force: if overwrite then 'true' else 'false'
    doPost "/3/Frames/#{encodeURIComponent key}/export", params, go

  requestColumnSummary = (frameKey, column, go) ->
    doGet "/3/Frames/#{encodeURIComponent frameKey}/columns/#{encodeURIComponent column}/summary", unwrap go, (result) -> head result.frames

  requestJobs = (go) ->
    doGet '/3/Jobs', (error, result) ->
      if error
        go new FlowError 'Error fetching jobs', error
      else
        go null, result.jobs

  requestJob = (key, go) ->
    doGet "/3/Jobs/#{encodeURIComponent key}", (error, result) ->
      if error
        go new FlowError "Error fetching job '#{key}'", error
      else
        go null, head result.jobs

  requestCancelJob = (key, go) ->
    doPost "/3/Jobs/#{encodeURIComponent key}/cancel", {}, (error, result) ->
      if error
        go new FlowError "Error canceling job '#{key}'", error
      else
        go null

  requestFileGlob = (path, limit, go) ->
    opts =
      src: encodeURIComponent path
      limit: limit
    requestWithOpts '/3/Typeahead/files', opts, go

  requestImportFiles = (paths, go) ->
    tasks = map paths, (path) ->
      (go) ->
        requestImportFile path, go
    (iterate tasks) go

  requestImportFile = (path, go) ->
    opts = path: encodeURIComponent path
    requestWithOpts '/3/ImportFiles', opts, go

  requestImportSqlTable = (args, go) ->
    decryptedPassword = util.decryptPassword args.password
    opts =
      connection_url: args.connection_url
      table: args.table
      username: args.username
      password: decryptedPassword
      fetch_mode: args.fetch_mode
    if args.columns != ''
      opts.columns = args.columns
    doPost '/99/ImportSQLTable', opts, go

  requestParseSetup = (sourceKeys, go) ->
    opts =
      source_frames: encodeArrayForPost sourceKeys
    doPost '/3/ParseSetup', opts, go

  requestParseSetupPreview = (sourceKeys, parseType, separator, useSingleQuotes, checkHeader, columnTypes, go) ->
    opts =
      source_frames: encodeArrayForPost sourceKeys
      parse_type: parseType
      separator: separator
      single_quotes: useSingleQuotes
      check_header: checkHeader
      column_types: encodeArrayForPost columnTypes
    doPost '/3/ParseSetup', opts, go

  requestParseFiles = (sourceKeys, destinationKey, parseType, separator, columnCount, useSingleQuotes, columnNames, columnTypes, deleteOnDone, checkHeader, chunkSize, go) ->
    opts =
      destination_frame: destinationKey
      source_frames: encodeArrayForPost sourceKeys
      parse_type: parseType
      separator: separator
      number_columns: columnCount
      single_quotes: useSingleQuotes
      column_names: encodeArrayForPost columnNames
      column_types: encodeArrayForPost columnTypes
      check_header: checkHeader
      delete_on_done: deleteOnDone
      chunk_size: chunkSize
    doPost '/3/Parse', opts, go

  # Create data for partial dependence plot(s)
  # for the specified model and frame.
  #
  # make a post request to h2o-3 to do request
  # the data about the specified model and frame
  # subject to the other options `opts`
  #
  # returns a job
  requestPartialDependence = (opts, go) ->
    doPost '/3/PartialDependence/', opts, go


  # make a post request to h2o-3 to do request
  # the data about the specified model and frame
  # subject to the other options `opts`
  #
  # returns a json response that contains
  #
  requestPartialDependenceData = (key, go) ->
    doGet "/3/PartialDependence/#{encodeURIComponent key}", (error, result) ->
      if error
        go error, result
      else go error, result

  requestGrids = (go) ->
    doGet "/99/Grids", (error, result) ->
      if error
        go error, result
      else
        go error, result.grids

  requestLeaderboard = (key, go) ->
    doGet "/99/AutoML/#{encodeURIComponent key}", (error, result) ->
      if error
        go error, result
      else
        go error, result


  requestModels = (go, opts) ->
    requestWithOpts '/3/Models', opts, (error, result) ->
      if error
        go error, result
      else
        go error, result.models

  requestGrid = (key, opts, go) ->
    params = undefined
    if opts
      params = {}
      if opts.sort_by
        params.sort_by = encodeURIComponent opts.sort_by
      if (opts.decreasing is yes) or (opts.decreasing is no)
        params.decreasing = opts.decreasing
    doGet (composePath "/99/Grids/#{encodeURIComponent key}", params), go

  requestModel = (key, go) ->
    doGet "/3/Models/#{encodeURIComponent key}", (error, result) ->
      if error
        go error, result
      else
        go error, head result.models

  requestPojoPreview = (key, go) ->
    download 'text', "/3/Models.java/#{encodeURIComponent key}/preview", go

  requestDeleteModel = (key, go) ->
    doDelete "/3/Models/#{encodeURIComponent key}", go

  requestImportModel = (path, overwrite, go) ->
    opts =
      dir: path
      force: overwrite
    doPost "/99/Models.bin/not_in_use", opts, go

  requestExportModel = (format, key, path, overwrite, go) ->
    doGet "/99/Models.#{format}/#{encodeURIComponent key}?dir=#{encodeURIComponent path}&force=#{overwrite}", go

  # TODO Obsolete
  requestModelBuildersVisibility = (go) ->
    doGet '/3/Configuration/ModelBuilders/visibility', unwrap go, (result) -> result.value

  __modelBuilders = null
  __modelBuilderEndpoints = null
  __gridModelBuilderEndpoints = null
  cacheModelBuilders = (modelBuilders) ->
    modelBuilderEndpoints = {}
    gridModelBuilderEndpoints = {}
    for modelBuilder in modelBuilders
      modelBuilderEndpoints[modelBuilder.algo] = "/#{modelBuilder.__meta.schema_version}/ModelBuilders/#{modelBuilder.algo}"
      gridModelBuilderEndpoints[modelBuilder.algo] = "/99/Grid/#{modelBuilder.algo}"
    __modelBuilderEndpoints = modelBuilderEndpoints
    __gridModelBuilderEndpoints = gridModelBuilderEndpoints
    __modelBuilders = modelBuilders

  getModelBuilders = -> __modelBuilders
  getModelBuilderEndpoint = (algo) -> __modelBuilderEndpoints[algo]
  getGridModelBuilderEndpoint = (algo) -> __gridModelBuilderEndpoints[algo]

  requestModelBuilders = (go) ->
    if modelBuilders = getModelBuilders()
      go null, modelBuilders
    else
      # requestModelBuildersVisibility (error, visibility) ->
      #  visibility = if error then 'Stable' else visibility
      visibility = 'Stable'
      doGet "/3/ModelBuilders", unwrap go, (result) ->
        builders = (builder for algo, builder of result.model_builders)
        availableBuilders = switch visibility
          when 'Stable'
            for builder in builders when builder.visibility is visibility
              builder
          when 'Beta'
            for builder in builders when builder.visibility is visibility or builder.visibility is 'Stable'
              builder
          else
            builders
        cacheModelBuilders availableBuilders

  requestModelBuilder = (algo, go) ->
    doGet getModelBuilderEndpoint(algo), go

  requestModelInputValidation = (algo, parameters, go) ->
    doPost "#{getModelBuilderEndpoint(algo)}/parameters", (encodeObjectForPost parameters), go

  requestModelBuild = (algo, parameters, go) ->
    _.trackEvent 'model', algo
    if parameters.hyper_parameters
      # super-hack: nest this object as stringified json
      parameters.hyper_parameters = stringify parameters.hyper_parameters
      if parameters.search_criteria
        parameters.search_criteria = stringify parameters.search_criteria
      doPost getGridModelBuilderEndpoint(algo), (encodeObjectForPost parameters), go
    else
      doPost getModelBuilderEndpoint(algo), (encodeObjectForPost parameters), go

  requestAutoModelBuild = (parameters, go) ->
    doPostJSON "/99/AutoMLBuilder", parameters, go

  requestPredict = (destinationKey, modelKey, frameKey, options, go) ->
    opts = {}
    opts.predictions_frame = destinationKey if destinationKey
    unless undefined is (opt = options.reconstruction_error)
      opts.reconstruction_error = opt
    unless undefined is (opt = options.deep_features_hidden_layer)
      opts.deep_features_hidden_layer = opt
    unless undefined is (opt = options.leaf_node_assignment)
      opts.leaf_node_assignment = opt
    unless undefined is (opt = options.exemplar_index)
      opts.exemplar_index = opt

    doPost "/3/Predictions/models/#{encodeURIComponent modelKey}/frames/#{encodeURIComponent frameKey}", opts, (error, result) ->
      if error
        go error
      else
        go null, result

  requestPrediction = (modelKey, frameKey, go) ->
    doGet "/3/ModelMetrics/models/#{encodeURIComponent modelKey}/frames/#{encodeURIComponent frameKey}", (error, result) ->
      if error
        go error
      else
        go null, result

  requestPredictions = (modelKey, frameKey, _go) ->
    go = (error, result) ->
      if error
        _go error
      else
        #
        # TODO workaround for a filtering bug in the API
        #
        predictions = for prediction in result.model_metrics
          if modelKey and prediction.model.name isnt modelKey
            null
          else if frameKey and prediction.frame.name isnt frameKey
            null
          else
            prediction
        _go null, (prediction for prediction in predictions when prediction)

    if modelKey and frameKey
      doGet "/3/ModelMetrics/models/#{encodeURIComponent modelKey}/frames/#{encodeURIComponent frameKey}", go
    else if modelKey
      doGet "/3/ModelMetrics/models/#{encodeURIComponent modelKey}", go
    else if frameKey
      doGet "/3/ModelMetrics/frames/#{encodeURIComponent frameKey}", go
    else
      doGet "/3/ModelMetrics", go

#
#  requestObjects = (type, go) ->
#    go null, Flow.LocalStorage.list type
#
#  requestObject = (type, name, go) ->
#    go null, Flow.LocalStorage.read type, name
#
#  requestDeleteObject = (type, name, go) ->
#    go null, Flow.LocalStorage.purge type, name
#
#  requestPutObject = (type, name, obj, go) ->
#    go null, Flow.LocalStorage.write type, name, obj
#
  _storageConfiguration = null
  requestIsStorageConfigured = (go) ->
    if _storageConfiguration
      go null, _storageConfiguration.isConfigured
    else
      doGet "/3/NodePersistentStorage/configured", (error, result) ->
        _storageConfiguration = isConfigured: if error then no else result.configured
        go null, _storageConfiguration.isConfigured

  requestObjects = (type, go) ->
    doGet "/3/NodePersistentStorage/#{encodeURIComponent type}", unwrap go, (result) -> result.entries

  requestObjectExists = (type, name, go) ->
    doGet "/3/NodePersistentStorage/categories/#{encodeURIComponent type}/names/#{encodeURIComponent name}/exists", (error, result) ->
      go null, if error then no else result.exists

  requestObject = (type, name, go) ->
    doGet "/3/NodePersistentStorage/#{encodeURIComponent type}/#{encodeURIComponent name}", unwrap go, (result) -> JSON.parse result.value

  requestDeleteObject = (type, name, go) ->
    doDelete "/3/NodePersistentStorage/#{encodeURIComponent type}/#{encodeURIComponent name}", go

  requestPutObject = (type, name, value, go) ->
    uri = "/3/NodePersistentStorage/#{encodeURIComponent type}"
    uri += "/#{encodeURIComponent name}" if name
    doPost uri, { value: stringify value, null, 2 }, unwrap go, (result) -> result.name

  requestUploadObject = (type, name, formData, go) ->
    uri = "/3/NodePersistentStorage.bin/#{encodeURIComponent type}"
    uri += "/#{encodeURIComponent name}" if name
    doUpload uri, formData, unwrap go, (result) -> result.name

  requestUploadFile = (key, formData, go) ->
    doUpload "/3/PostFile?destination_frame=#{encodeURIComponent key}", formData, go

  requestCloud = (go) ->
    doGet '/3/Cloud', go

  requestTimeline = (go) ->
    doGet '/3/Timeline', go

  requestProfile = (depth, go) ->
    doGet "/3/Profiler?depth=#{depth}", go

  requestStackTrace = (go) ->
    doGet '/3/JStack', go

  requestRemoveAll = (go) ->
    doDelete '/3/DKV', go

  requestEcho = (message, go) ->
    doPost '/3/LogAndEcho', { message: message }, go

  requestLogFile = (nodeIpPort, fileType, go) ->
    doGet "/3/Logs/nodes/#{nodeIpPort}/files/#{fileType}", go

  requestNetworkTest = (go) ->
    doGet '/3/NetworkTest', go

  requestAbout = (go) ->
    doGet '/3/About', go

  requestShutdown = (go) ->
    doPost "/3/Shutdown", {}, go

  requestEndpoints = (go) ->
    doGet '/3/Metadata/endpoints', go

  requestEndpoint = (index, go) ->
    doGet "/3/Metadata/endpoints/#{index}", go

  requestSchemas = (go) ->
    doGet '/3/Metadata/schemas', go

  requestSchema = (name, go) ->
    doGet "/3/Metadata/schemas/#{encodeURIComponent name}", go

  getLines = (data) ->
    filter (data.split '\n'), (line) -> if line.trim() then yes else no

  requestPacks = (go) ->
    download 'text', '/flow/packs/index.list', unwrap go, getLines

  requestPack = (packName, go) ->
    download 'text', "/flow/packs/#{encodeURIComponent packName}/index.list", unwrap go, getLines

  requestFlow = (packName, flowName, go) ->
    download 'json', "/flow/packs/#{encodeURIComponent packName}/#{encodeURIComponent flowName}", go

  requestHelpIndex = (go) ->
    download 'json', '/flow/help/catalog.json', go

  requestHelpContent = (name, go) ->
    download 'text', "/flow/help/#{name}.html", go

  requestRDDs = (go) ->
    doGet '/3/RDDs', go

  requestDataFrames = (go) ->
    doGet '/3/dataframes', go

  requestScalaIntp = (go) ->
    doPost '/3/scalaint', {}, go

  requestScalaCode = (session_id, code, go) ->
    doPost "/3/scalaint/#{session_id}", {code: code}, go

  requestAsH2OFrameFromRDD = (rdd_id, name, go) ->
    if name==undefined
      doPost "/3/RDDs/#{rdd_id}/h2oframe", {}, go
    else
      doPost "/3/RDDs/#{rdd_id}/h2oframe", {h2oframe_id: name}, go

  requestAsH2OFrameFromDF = (df_id, name, go) ->
    if name==undefined
      doPost "/3/dataframes/#{df_id}/h2oframe", {}, go
    else
      doPost "/3/dataframes/#{df_id}/h2oframe", {h2oframe_id: name}, go

  requestAsDataFrame = (hf_id, name, go) ->
    if name==undefined
      doPost "/3/h2oframes/#{hf_id}/dataframe", {}, go
    else
      doPost "/3/h2oframes/#{hf_id}/dataframe", {dataframe_id: name}, go

  requestScalaCodeExecutionResult = (key, go) ->
    doPost "/3/scalaint/result/#{key}", {result_key: key}, go

  link _.requestInspect, requestInspect
  link _.requestCreateFrame, requestCreateFrame
  link _.requestSplitFrame, requestSplitFrame
  link _.requestFrames, requestFrames
  link _.requestFrame, requestFrame
  link _.requestFrameSlice, requestFrameSlice
  link _.requestFrameSummary, requestFrameSummary
  link _.requestFrameSummaryWithoutData, requestFrameSummaryWithoutData
  link _.requestFrameSummarySlice, requestFrameSummarySlice
  link _.requestDeleteFrame, requestDeleteFrame
  link _.requestExportFrame, requestExportFrame
  link _.requestColumnSummary, requestColumnSummary
  link _.requestJobs, requestJobs
  link _.requestJob, requestJob
  link _.requestCancelJob, requestCancelJob
  link _.requestFileGlob, requestFileGlob
  link _.requestImportFiles, requestImportFiles
  link _.requestImportFile, requestImportFile
  link _.requestImportSqlTable, requestImportSqlTable
  link _.requestParseSetup, requestParseSetup
  link _.requestParseSetupPreview, requestParseSetupPreview
  link _.requestParseFiles, requestParseFiles
  link _.requestPartialDependence, requestPartialDependence
  link _.requestPartialDependenceData, requestPartialDependenceData
  link _.requestGrids, requestGrids
  link _.requestLeaderboard, requestLeaderboard
  link _.requestModels, requestModels
  link _.requestGrid, requestGrid
  link _.requestModel, requestModel
  link _.requestPojoPreview, requestPojoPreview
  link _.requestDeleteModel, requestDeleteModel
  link _.requestImportModel, requestImportModel
  link _.requestExportModel, requestExportModel
  link _.requestModelBuilder, requestModelBuilder
  link _.requestModelBuilders, requestModelBuilders
  link _.requestModelBuild, requestModelBuild
  link _.requestModelInputValidation, requestModelInputValidation
  link _.requestAutoModelBuild, requestAutoModelBuild
  link _.requestPredict, requestPredict
  link _.requestPrediction, requestPrediction
  link _.requestPredictions, requestPredictions
  link _.requestObjects, requestObjects
  link _.requestObject, requestObject
  link _.requestObjectExists, requestObjectExists
  link _.requestDeleteObject, requestDeleteObject
  link _.requestPutObject, requestPutObject
  link _.requestUploadObject, requestUploadObject
  link _.requestUploadFile, requestUploadFile
  link _.requestCloud, requestCloud
  link _.requestTimeline, requestTimeline
  link _.requestProfile, requestProfile
  link _.requestStackTrace, requestStackTrace
  link _.requestRemoveAll, requestRemoveAll
  link _.requestEcho, requestEcho
  link _.requestLogFile, requestLogFile
  link _.requestNetworkTest, requestNetworkTest
  link _.requestAbout, requestAbout
  link _.requestShutdown, requestShutdown
  link _.requestEndpoints, requestEndpoints
  link _.requestEndpoint, requestEndpoint
  link _.requestSchemas, requestSchemas
  link _.requestSchema, requestSchema
  link _.requestPacks, requestPacks
  link _.requestPack, requestPack
  link _.requestFlow, requestFlow
  link _.requestHelpIndex, requestHelpIndex
  link _.requestHelpContent, requestHelpContent
  link _.requestExec, requestExec
  #
  # Sparkling-Water
  link _.requestRDDs, requestRDDs
  link _.requestDataFrames, requestDataFrames
  link _.requestScalaIntp, requestScalaIntp
  link _.requestScalaCode, requestScalaCode
  link _.requestAsH2OFrameFromDF, requestAsH2OFrameFromDF
  link _.requestAsH2OFrameFromRDD, requestAsH2OFrameFromRDD
  link _.requestAsDataFrame, requestAsDataFrame
  link _.requestScalaCodeExecutionResult, requestScalaCodeExecutionResult


