system = require 'system'
webpage =  require 'webpage'

phantom.onError = (message, stacktrace) ->
  if stacktrace?.length
    stack = for t in stacktrace
      ' -> ' + (t.file || t.sourceURL) + ': ' + t.line + (if t.function then ' (in function ' + t.function + ')' else '')
    console.log "PHANTOM: *** ERROR *** #{message}\n" + stack.join '\n'
    phantom.exit 1

printUsageAndExit = (message) ->
  console.log "*** #{message} ***"
  console.log 'Usage: phantomjs headless-test.js [--host ip:port] [--timeout seconds] [--packs foo:bar:baz] \
                                                 [--perf date buildId gitHash gitBranch ncpu os jobName outputDir] \
                                                 [--excludeFlows flow1;flow2]'
  console.log '    ip:port      defaults to localhost:54321'
  console.log '    timeout      defaults to 3600'
  console.log '    packs        defaults to examples'
  console.log '    perf         performance of individual tests will be recorded in perf.csv in the output directory'
  console.log '    excludeFlows do not run these flows'
  phantom.exit 1

parseOpts = (args) ->
  console.log "Using args #{args.join ' '}"
  i = 0
  opts = {}
  while i < args.length
    if args[i] == "--host"
      i = i + 1
      if i > args.length then printUsageAndExit "Unknown argument: #{args[i]}"
      opts['hostname'] = args[i]
    else if args[i] == "--timeout"
      i = i + 1
      if i > args.length then printUsageAndExit "Unknown argument: #{args[i]}"
      opts['timeout'] = args[i]
    else if args[i] == "--packs"
      i = i + 1
      if i > args.length then printUsageAndExit "Unknown argument: #{args[i]}"
      opts['packs'] = args[i]
    else if args[i] == "--perf"
      opts['perf'] = true
      i = i + 1
      if i > args.length then printUsageAndExit "Unknown argument: #{args[i]}"
      opts['date'] = args[i]
      i = i + 1
      if i > args.length then printUsageAndExit "Unknown argument: #{args[i]}"
      opts['buildId'] = args[i]
      i = i + 1
      if i > args.length then printUsageAndExit "Unknown argument: #{args[i]}"
      opts['gitHash'] = args[i]
      i = i + 1
      if i > args.length then printUsageAndExit "Unknown argument: #{args[i]}"
      opts['gitBranch'] = args[i]
      i = i + 1
      if i > args.length then printUsageAndExit "Unknown argument: #{args[i]}"
      opts['ncpu'] = args[i]
      i = i + 1
      if i > args.length then printUsageAndExit "Unknown argument: #{args[i]}"
      opts['os'] = args[i]
      i = i + 1
      if i > args.length then printUsageAndExit "Unknown argument: #{args[i]}"
      opts['jobName'] = args[i]
      i = i + 1
      if i > args.length then printUsageAndExit "Unknown argument: #{args[i]}"
      opts['outputDir'] = args[i]
    else if args[i] == "--excludeFlows"
      i = i + 1
      if i > args.length then printUsageAndExit "Unknown argument: #{args[i]}"
      opts['excludeFlows'] = args[i]
    else
      printUsageAndExit "Unknown argument: #{args[i]}"
    i = i + 1
  opts

opts = parseOpts system.args[1..]

hostname = opts['hostname'] ? 'localhost:54321'
console.log "PHANTOM: Using #{hostname}"

timeout = if timeoutArg = opts['timeout']
  1000 * parseInt timeoutArg, 10
else
  3600000
console.log "PHANTOM: Using timeout #{timeout}ms"

packsArg = opts['packs']
packNames = if packsArg
  packsArg.split ':'
else
  ['examples']

excludeFlowsArg = opts['excludeFlows']
excludeFlowsNames = if excludeFlowsArg
  excludeFlowsArg.split ';'
else
  []
for excludeFlowName in excludeFlowsNames
  console.log "PHANTOM: Excluding flow: #{excludeFlowName}"

page = webpage.create()

if opts['perf']
  console.log "PHANTOM: Performance of individual tests will be recorded in perf.csv in output directory: \
               #{opts['outputDir']}."
  page._outputDir = opts['outputDir']

page.onResourceError = ({ url, errorString }) ->
  console.log "BROWSER: *** RESOURCE ERROR *** #{url}: #{errorString}"

page.onConsoleMessage = (message) ->
  console.log "BROWSER: #{message}"

page.onCallback = (perfLine) ->
  fs = require 'fs'
  fs.write page._outputDir + '/perf.csv', perfLine, 'a'

waitFor = (test, onReady) ->
  startTime = new Date().getTime()
  isComplete = no
  retest = ->
    if (new Date().getTime() - startTime < timeout) and not isComplete
      console.log 'PHANTOM: PING'
      isComplete = test()
    else
      if isComplete
        onReady()
        clearInterval interval
      else
        console.log 'PHANTOM: *** ERROR *** Timeout Exceeded'
        phantom.exit 1

  interval = setInterval retest, 2000

runner = (packNames, date, buildId, gitHash, gitBranch, hostname, ncpu, os, jobName, perf, excludeFlowsNames) ->
  window._date = date
  window._buildId = buildId
  window._gitHash = gitHash
  window._gitBranch = gitBranch
  window._hostname = hostname
  window._ncpu = ncpu
  window._os = os
  window._jobName = jobName
  window._perf = perf
  window._excludeFlowsNames = excludeFlowsNames
  console.log "getting context from window.flow", window.flow
  context = window.flow.context
  async = window.flow.async
  if window._phantom_started_
    if window._phantom_exit_ then yes else no
  else
    runPacks = (go) ->
      window._phantom_test_summary_ = {}
      tasks = packNames.map (packName) ->
        (go) -> runPack packName, go
      (async.iterate tasks) go

    runPack = (packName, go) ->
      console.log "Fetching pack: #{packName}..."
      context.requestPack packName, (error, flowNames) ->
        if error
          console.log "*** ERROR *** Failed fetching pack #{packName}"
          go new Error "Failed fetching pack #{packName}", error
        else
          console.log 'Processing pack...'
          tasks = flowNames.map (flowName) ->
            (go) -> runFlow packName, flowName, go
          (async.iterate tasks) go

    runFlow = (packName, flowName, go) ->
      doFlow = (flowName, excludeFlowsNames) ->
        for f in excludeFlowsNames
          return false if flowName is f
        true

      if doFlow flowName, window._excludeFlowsNames
        flowTitle = "#{packName} - #{flowName}"
        window._phantom_test_summary_[flowTitle] = 'FAILED'
        console.log "Fetching flow document: #{packName} - #{flowName}..."
        context.requestFlow packName, flowName, (error, flow) ->
          if error
            console.log "*** ERROR *** Failed fetching flow #{flowTitle}"
            go new Error "Failed fetching flow #{flowTitle}", error
          else
            console.log "Opening flow #{flowTitle}..."

            window._phantom_running_ = yes

            # open flow
            context.open flowTitle, flow

            waitForFlow = ->
              if window._phantom_running_
                console.log 'ACK'
                setTimeout waitForFlow, 2000
              else
                console.log 'Flow completed!'
                errors = window._phantom_errors_
                # delete all keys from the k/v store
                context.requestRemoveAll ->
                  go if errors then errors else null

            console.log 'Running flow...'
            window._startTime = new Date().getTime() / 1000
            context.executeAllCells yes, (status, errors) ->
              window._endTime = new Date().getTime() / 1000
              console.log "Flow finished with status: #{status}"
              if status is 'failed'
                window._pass = 0
                window._phantom_errors_ = errors
              else
                window._pass = 1
                window._phantom_test_summary_[flowTitle] = 'PASSED'
              if window._perf
                window.callPhantom "#{window._date}, #{window._buildId}, #{window._gitHash}, \
                                            #{window._gitBranch}, #{window._hostname}, #{flowName}, \
                                            #{window._startTime}, #{window._endTime}, #{window._pass}, \
                                            #{window._ncpu}, #{window._os}, #{window._jobName}\n"
              window._phantom_running_ = no

          setTimeout waitForFlow, 2000
      else
        console.log "Ignoring flow: #{flowName}"
        go null

    console.log 'Starting tests...'
    window._phantom_errors_ = null
    window._phantom_started_ = yes
    runPacks (error) ->
      if error
        console.log '*** ERROR *** Error running packs'
        window._phantom_errors_ = error.message ? error
      else
        console.log 'Finished running all packs!'
      window._phantom_exit_ = yes
    no

page.open "http://#{hostname}", (status) ->
  if status is 'success'
    test = ->
      page.evaluate(runner, \
        packNames, opts['date'], opts['buildId'], opts['gitHash'], opts['gitBranch'], hostname, \
        opts['ncpu'], opts['os'], opts['jobName'], opts['perf'], excludeFlowsNames
      )

    printErrors = (errors, prefix='') ->
      if errors
        if Array.isArray errors
          (printErrors error, prefix + '  ' for error in errors).join '\n'
        else if errors.message
          if errors.cause
            errors.message + '\n' + printErrors errors.cause, prefix + '  '
          else
            errors.message
        else
          errors
      else
        errors

    waitFor test, ->
      errors = page.evaluate -> window._phantom_errors_
      if errors
        console.log '------------------ FAILED -------------------'
        console.log printErrors errors
        console.log '---------------------------------------------'
        phantom.exit 1
      else
        summary = page.evaluate -> window._phantom_test_summary_
        console.log '------------------ PASSED -------------------'
        testCount = 0
        for flowTitle, testStatus of summary
          console.log "#{testStatus}: #{flowTitle}"
          testCount++
        console.log "(#{testCount} tests executed.)"
        console.log '---------------------------------------------'
        phantom.exit 0
  else
    console.log 'PHANTOM: *** ERROR *** Unable to access network.'
    phantom.exit 1
