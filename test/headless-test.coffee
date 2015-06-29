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
  console.log 'Usage: phantomjs headless-test.js [--host ip:port] [--timeout seconds] --packs foo:bar:baz'
  console.log '    ip:port  defaults to localhost:54321'
  console.log '    timeout  defaults to 3600'
  phantom.exit 1

parseOpts = (args) ->
  console.log "Using args #{args.join ' '}"
  if args.length % 2 is 1
    printUsageAndExit 'Expected even number of command line arguments'
  opts = {}
  for key, i in args when i % 2 is 0
    if key[0 .. 1] isnt '--'
      return printUsageAndExit "Expected keyword. Found #{key}"
    opts[key] = args[i + 1]
  opts

opts = parseOpts system.args[1..]

hostname = opts['--host'] ? 'localhost:54321'
console.log "PHANTOM: Using #{hostname}"

timeout = if timeoutArg = opts['--timeout']
  1000 * parseInt timeoutArg, 10
else
  3600000
console.log "PHANTOM: Using timeout #{timeout}ms"

packsArg = opts['--packs']
packNames = if packsArg
  packsArg.split ':'
else
  ['examples']

page = webpage.create()

page.onResourceError = ({ url, errorString }) ->
  console.log "BROWSER: *** RESOURCE ERROR *** #{url}: #{errorString}"

page.onConsoleMessage = (message) ->
  console.log "BROWSER: #{message}"

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

page.open "http://#{hostname}/flow/index.html", (status) ->
  if status is 'success'
    test = ->
      page.evaluate(
        (packNames) ->
          context = window.flow.context
          if window._phantom_started_
            if window._phantom_exit_ then yes else no
          else
            runPacks = (go) ->
              window._phantom_test_summary_ = {}
              tasks = packNames.map (packName) ->
                (go) -> runPack packName, go
              (Flow.Async.iterate tasks) go

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
                  (Flow.Async.iterate tasks) go

            runFlow = (packName, flowName, go) ->
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
                  context.executeAllCells yes, (status, errors) ->
                    console.log "Flow finished with status: #{status}"
                    if status is 'failed'
                      window._phantom_errors_ = errors
                    else
                      window._phantom_test_summary_[flowTitle] = 'PASSED'
                    window._phantom_running_ = no

                  setTimeout waitForFlow, 2000

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
        packNames
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


