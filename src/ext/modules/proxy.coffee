H2O.Proxy = (_) ->

  download = (type, url, go) ->
    $.ajax
      dataType: type
      url: url
      success: (data, status, xhr) -> go null, data
      error: (xhr, status, error) -> go new Flow.Error error
  
  http = (method, path, opts, go) ->
    _.status 'server', 'request', path

    trackPath path

    req = switch method
      when 'GET'
        $.getJSON path
      when 'POST'
        $.post path, opts
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
        go new Flow.Error "Error processing #{method} #{path}", error

    req.fail (xhr, status, error) ->
      _.status 'server', 'error', path

      response = xhr.responseJSON
      
      cause = if response?.__meta?.schema_type is 'H2OError'
        serverError = new Flow.Error response.exception_msg
        serverError.stack = "#{response.dev_msg} (#{response.exception_type})" + "\n  " + response.stacktrace.join "\n  "
        serverError
      else if error?.message
        new Flow.Error error.message
      else if status is 0
        new Flow.Error 'Could not connect to H2O'
      else if isString error
        new Flow.Error error
      else
        new Flow.Error 'Unknown error'

      go new Flow.Error "Error calling #{method} #{path} with opts #{JSON.stringify opts}", cause

  doGet = (path, go) -> http 'GET', path, null, go
  doPost = (path, opts, go) -> http 'POST', path, opts, go
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
      path + '?' + join params, '&'
    else
      path

  requestWithOpts = (path, opts, go) ->
    doGet (composePath path, opts), go

  encodeArrayForPost = (array) -> 
    if array
      if array.length is 0
        null 
      else 
        "[#{join (map array, (element) -> if isNumber element then element else "\"#{element}\""), ','}]"
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
    doPost '/3/Rapids', { ast: ast }, (error, result) ->
      if error
        go error
      else
        #TODO HACK - this api returns a 200 OK on failures
        if result.error
          go new Flow.Error result.error
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

  requestFrame = (key, go) ->
    doGet "/3/Frames/#{encodeURIComponent key}", (error, result) ->
      if error
        go error
      else
        go null, head result.frames

  requestFrameSummary = (key, go) ->
    doGet "/3/Frames/#{encodeURIComponent key}/summary", (error, result) ->
      if error
        go error
      else
        go null, head result.frames

  requestDeleteFrame = (key, go) ->
    doDelete "/3/Frames/#{encodeURIComponent key}", go

  requestRDDs = (go) ->
    doGet '/3/RDDs', (error, result) ->
      if error
        go error
      else
        go null, result.rdds

  requestColumnSummary = (key, column, go) ->
    doGet "/3/Frames/#{encodeURIComponent key}/columns/#{encodeURIComponent column}/summary", (error, result) ->
      if error
        go error
      else
        go null, head result.frames

  requestJobs = (go) ->
    doGet '/3/Jobs', (error, result) ->
      if error
        go new Flow.Error 'Error fetching jobs', error
      else
        go null, result.jobs 

  requestJob = (key, go) ->
    doGet "/3/Jobs/#{encodeURIComponent key}", (error, result) ->
      if error
        go new Flow.Error "Error fetching job '#{key}'", error
      else
        go null, head result.jobs

  requestCancelJob = (key, go) ->
    doPost "/3/Jobs/#{encodeURIComponent key}/cancel", {}, (error, result) ->
      if error
        go new Flow.Error "Error canceling job '#{key}'", error
      else
        debug result
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
    (Flow.Async.iterate tasks) go

  requestImportFile = (path, go) ->
    opts = path: encodeURIComponent path
    requestWithOpts '/3/ImportFiles', opts, go

  requestParseSetup = (sourceKeys, go) ->
    opts =
      source_keys: encodeArrayForPost sourceKeys
    doPost '/3/ParseSetup', opts, go

  requestParseSetupPreview = (sourceKeys, parseType, separator, useSingleQuotes, checkHeader, columnTypes, go) ->
    opts = 
      source_keys: encodeArrayForPost sourceKeys
      parse_type: parseType
      separator: separator
      single_quotes: useSingleQuotes
      check_header: checkHeader
      column_types: encodeArrayForPost columnTypes
    doPost '/3/ParseSetup', opts, go

  requestParseFiles = (sourceKeys, destinationKey, parseType, separator, columnCount, useSingleQuotes, columnNames, columnTypes, deleteOnDone, checkHeader, chunkSize, go) ->
    opts =
      destination_key: destinationKey
      source_keys: encodeArrayForPost sourceKeys
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

  patchUpModels = (models) ->
    for model in models
      for parameter in model.parameters
        switch parameter.type
          when 'Key<Frame>', 'Key<Model>', 'VecSpecifier'
            if isString parameter.actual_value
              try
                parameter.actual_value = JSON.parse parameter.actual_value
              catch parseError
    models

  requestModels = (go, opts) ->
    requestWithOpts '/3/Models', opts, (error, result) ->
      if error
        go error, result
      else
        go error, patchUpModels result.models

  requestModel = (key, go) ->
    doGet "/3/Models/#{encodeURIComponent key}", (error, result) ->
      if error
        go error, result
      else
        go error, head patchUpModels result.models

  requestDeleteModel = (key, go) ->
    doDelete "/3/Models/#{encodeURIComponent key}", go

  requestModelBuilders = (go) ->
    doGet "/3/ModelBuilders", unwrap go, (result) ->
      for algo, builder of result.model_builders
        builder

  requestModelBuilder = (algo, go) ->
    doGet "/3/ModelBuilders/#{algo}", go

  requestModelInputValidation = (algo, parameters, go) ->
    doPost "/3/ModelBuilders/#{algo}/parameters", (encodeObjectForPost parameters), go

  requestModelBuild = (algo, parameters, go) ->
    _.trackEvent 'model', algo
    doPost "/3/ModelBuilders/#{algo}", (encodeObjectForPost parameters), go

  requestPredict = (destinationKey, modelKey, frameKey, go) ->
    opts = if destinationKey
      destination_key: destinationKey
    else
      {}

    doPost "/3/Predictions/models/#{encodeURIComponent modelKey}/frames/#{encodeURIComponent frameKey}", opts, (error, result) ->
      if error
        go error
      else
        go null, head result.model_metrics

  requestPrediction = (modelKey, frameKey, go) ->
    doGet "/3/ModelMetrics/models/#{encodeURIComponent modelKey}/frames/#{encodeURIComponent frameKey}", (error, result) ->
      if error
        go error
      else
        go null, head result.model_metrics

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

  requestObjects = (type, go) ->
    doGet "/3/NodePersistentStorage/#{encodeURIComponent type}", unwrap go, (result) -> result.entries

  requestObject = (type, name, go) ->
    doGet "/3/NodePersistentStorage/#{encodeURIComponent type}/#{encodeURIComponent name}", unwrap go, (result) -> JSON.parse result.value

  requestDeleteObject = (type, name, go) ->
    doDelete "/3/NodePersistentStorage/#{encodeURIComponent type}/#{encodeURIComponent name}", go

  requestPutObject = (type, name, value, go) ->
    uri = "/3/NodePersistentStorage/#{encodeURIComponent type}"
    uri += "/#{encodeURIComponent name}" if name
    doPost uri, { value: JSON.stringify value, null, 2 }, unwrap go, (result) -> result.name

  requestUploadObject = (type, name, formData, go) ->
    uri = "/3/NodePersistentStorage/#{encodeURIComponent type}"
    uri += "/#{encodeURIComponent name}" if name
    doUpload uri, formData, unwrap go, (result) -> result.name

  requestUploadFile = (key, formData, go) ->
    doUpload "/3/PostFile?destination_key=#{encodeURIComponent key}", formData, go

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

  requestLogFile = (nodeIndex, fileType, go) ->
    doGet "/3/Logs/nodes/#{nodeIndex}/files/#{fileType}", go

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
    filter (split data, '\n'), (line) -> if line.trim() then yes else no

  requestPacks = (go) ->
    download 'text', '/flow/packs/index.list', (error, data) ->
      if error
        go error
      else
        go null, getLines data

  requestPack = (packName, go) ->
    download 'text', "/flow/packs/#{encodeURIComponent packName}/index.list", (error, data) ->
      if error
        go error
      else
        go null, getLines data

  requestFlow = (packName, flowName, go) ->
    download 'json', "/flow/packs/#{encodeURIComponent packName}/#{encodeURIComponent flowName}", go

  requestHelpIndex = (go) ->
    download 'json', '/flow/help/catalog.json', go

  requestHelpContent = (name, go) ->
    download 'text', "/flow/help/#{name}.html", go

  link _.requestInspect, requestInspect
  link _.requestCreateFrame, requestCreateFrame
  link _.requestSplitFrame, requestSplitFrame
  link _.requestFrames, requestFrames
  link _.requestFrame, requestFrame
  link _.requestFrameSummary, requestFrameSummary
  link _.requestDeleteFrame, requestDeleteFrame
  link _.requestRDDs, requestRDDs
  link _.requestColumnSummary, requestColumnSummary
  link _.requestJobs, requestJobs
  link _.requestJob, requestJob
  link _.requestCancelJob, requestCancelJob
  link _.requestFileGlob, requestFileGlob
  link _.requestImportFiles, requestImportFiles
  link _.requestImportFile, requestImportFile
  link _.requestParseSetup, requestParseSetup
  link _.requestParseSetupPreview, requestParseSetupPreview
  link _.requestParseFiles, requestParseFiles
  link _.requestModels, requestModels
  link _.requestModel, requestModel
  link _.requestDeleteModel, requestDeleteModel
  link _.requestModelBuilder, requestModelBuilder
  link _.requestModelBuilders, requestModelBuilders
  link _.requestModelBuild, requestModelBuild
  link _.requestModelInputValidation, requestModelInputValidation
  link _.requestPredict, requestPredict
  link _.requestPrediction, requestPrediction
  link _.requestPredictions, requestPredictions
  link _.requestObjects, requestObjects
  link _.requestObject, requestObject
  link _.requestDeleteObject, requestDeleteObject
  link _.requestPutObject, requestPutObject
  link _.requestUploadObject, requestUploadObject
  link _.requestUploadFile, requestUploadFile
  link _.requestCloud, requestCloud
  link _.requestTimeline, requestTimeline
  link _.requestProfile, requestProfile
  link _.requestStackTrace, requestStackTrace
  link _.requestRemoveAll, requestRemoveAll
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


