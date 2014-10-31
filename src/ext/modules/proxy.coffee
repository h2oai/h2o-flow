H2O.Proxy = (_) ->
  createResponse = (status, data, xhr) ->
    status: status, data: data, xhr: xhr

  handleResponse = (go, jqxhr) ->
    jqxhr
      .done (data, status, xhr) ->
        go null, createResponse status, data, xhr
      .fail (xhr, status, error) ->
        go createResponse status, xhr.responseJSON, xhr

  h2oGet = (path, go) ->
    handleResponse go, $.getJSON path

  h2oPost = (path, opts, go) ->
    handleResponse go, $.post path, opts

  processResponse = (go) ->
    (error, result) ->
      if error
        #TODO error logging / retries, etc.
        go error, result
      else
        if result.data.response?.status is 'error'
          go result.data.error, result.data
        else
          go error, result.data

  request = (path, go) ->
    h2oGet path, processResponse go

  post = (path, opts, go) ->
    h2oPost path, opts, processResponse go

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
    request (composePath path, opts), go

  encodeArray = (array) -> "[#{join (map array, encodeURIComponent), ','}]"

  requestInspect = (key, go) ->
    opts = key: encodeURIComponent key
    requestWithOpts '/Inspect.json', opts, go

  requestFrames = (go) ->
    request '/3/Frames.json', (error, result) ->
      if error
        go error
      else
        go null, result.frames

  requestFrame = (key, go) ->
    request "/3/Frames/#{encodeURIComponent key}", (error, result) ->
      if error
        go error
      else
        go null, head result.frames

  requestColumnSummary = (key, column, go) ->
    request "/3/Frames/#{encodeURIComponent key}/columns/#{column}/summary", go

  requestJobs = (go) ->
    request '/Jobs.json', (error, result) ->
      if error
        go new Flow.Error 'Error fetching jobs', error
      else
        go null, result.jobs 

  requestJob = (key, go) ->
    #opts = key: encodeURIComponent key
    #requestWithOpts '/Job.json', opts, go
    request "/Jobs.json/#{encodeURIComponent key}", (error, result) ->
      if error
        go new Flow.Error "Error fetching job '#{key}'", error
      else
        go null, head result.jobs

  requestFileGlob = (path, limit, go) ->
    opts =
      src: encodeURIComponent path
      limit: limit
    requestWithOpts '/Typeahead.json/files', opts, go

  requestImportFiles = (paths, go) ->
    tasks = map paths, (path) ->
      (go) ->
        requestImportFile path, go
    (Flow.Async.iterate tasks) go

  requestImportFile = (path, go) ->
    opts = path: encodeURIComponent path
    requestWithOpts '/ImportFiles.json', opts, go

  requestParseSetup = (sources, go) ->
    encodedPaths = map sources, encodeURIComponent
    opts =
      srcs: "[#{join encodedPaths, ','}]"
    requestWithOpts '/ParseSetup.json', opts, go

  requestParseFiles = (sourceKeys, destinationKey, parserType, separator, columnCount, useSingleQuotes, columnNames, deleteOnDone, checkHeader, go) ->
    opts =
      hex: encodeURIComponent destinationKey
      srcs: encodeArray sourceKeys
      pType: parserType
      sep: separator
      ncols: columnCount
      singleQuotes: useSingleQuotes
      columnNames: encodeArray columnNames
      checkHeader: checkHeader
      delete_on_done: deleteOnDone
    requestWithOpts '/Parse.json', opts, go

  requestModels = (go, opts) ->
    requestWithOpts '/3/Models.json', opts, (error, result) ->
      if error
        go error, result
      else
        go error, result.models

  requestModel = (key, go) ->
    request "/3/Models.json/#{encodeURIComponent key}", (error, result) ->
      if error
        go error, result
      else
        go error, head result.models

  requestModelBuilders = (algo, go) ->
    request "/2/ModelBuilders.json/#{algo}", go

  requestModelInputValidation = (algo, parameters, go) ->
    post "/2/ModelBuilders.json/#{algo}/parameters", parameters, go

  requestModelBuild = (algo, parameters, go) ->
    post "/2/ModelBuilders.json/#{algo}", parameters, go

  requestModelMetrics = (modelKey, frameKey, go) ->
    post "/3/ModelMetrics.json/models/#{encodeURIComponent modelKey}/frames/#{encodeURIComponent frameKey}", {}, go

  link _.requestInspect, requestInspect
  link _.requestFrames, requestFrames
  link _.requestFrame, requestFrame
  link _.requestColumnSummary, requestColumnSummary
  link _.requestJobs, requestJobs
  link _.requestJob, requestJob
  link _.requestFileGlob, requestFileGlob
  link _.requestImportFiles, requestImportFiles
  link _.requestImportFile, requestImportFile
  link _.requestParseSetup, requestParseSetup
  link _.requestParseFiles, requestParseFiles
  link _.requestModels, requestModels
  link _.requestModel, requestModel
  link _.requestModelBuilders, requestModelBuilders
  link _.requestModelBuild, requestModelBuild
  link _.requestModelInputValidation, requestModelInputValidation
  link _.requestModelMetrics, requestModelMetrics

