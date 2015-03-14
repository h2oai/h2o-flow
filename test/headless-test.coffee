system = require 'system'
webpage =  require 'webpage'

phantom.onError = (message, stacktrace) ->
  if stacktrace?.length
    stack = for t in stacktrace
      ' -> ' + (t.file || t.sourceURL) + ': ' + t.line + (if t.function then ' (in function ' + t.function + ')' else '')
    console.log "ERROR: #{message}\n" + stack.join '\n'
    phantom.exit 1

hostname = system.args[1] ? 'localhost:54321'

page = webpage.create()

page.onResourceError = ({ url, errorString }) ->
  console.log "ERROR: #{url}: #{errorString}"

page.onConsoleMessage = (message) ->
  console.log message

waitFor = (test, onReady, timeout=3600000) ->
  startTime = new Date().getTime()
  condition = false
  retest = ->
    if (new Date().getTime() - startTime < timeout) and not condition
      console.log 'Polling...'
      condition = test()
    else
      if condition
        onReady()
        clearInterval interval
      else
        console.log 'ERROR: Timeout exceeded'
        phantom.exit 1 

  interval = setInterval retest, 2000

page.open "http://#{hostname}/flow/index.html", (status) ->
  if status is 'success'
    test = ->
      page.evaluate -> 
        context = window.flow.context
        if window._phantom_started_
          if window._phantom_exit_ then yes else no
        else
          runPacks = (go) ->
            console.log 'Fetching packs...'
            context.requestPacks (error, packNames) ->
              if error
                console.log 'Failed fetching packs'
                go error
              else
                console.log 'Processing packs...'
                tasks = packNames.map (packName) ->
                  (go) -> runPack packName, go
                (Flow.Async.iterate tasks) go

          runPack = (packName, go) ->
            console.log "Fetching pack: #{packName}"
            context.requestPack packName, (error, flowNames) ->
              if error
                console.log 'Failed fetching pack'
                go error
              else
                console.log 'Processing pack...'
                tasks = flowNames.map (flowName) ->
                  (go) -> runFlow packName, flowName, go
                (Flow.Async.iterate tasks) go

          runFlow = (packName, flowName, go) ->
            console.log "Fetching flow: #{packName} - #{flowName}"
            context.requestFlow packName, flowName, (error, flow) ->
              if error
                console.log 'Failed fetching flow'
                go error
              else
                flowTitle = "#{packName} - #{flowName}"
                console.log "Opening flow #{flowTitle}"

                window._phantom_running_ = yes

                # open flow
                context.open flowTitle, flow

                waitForFlow = ->
                  if window._phantom_running_
                    console.log 'Flow still running...'
                    setTimeout waitForFlow, 2000
                  else
                    console.log 'Flow completed'
                    errors = window._phantom_errors_
                    # delete all keys from the k/v store
                    context.requestRemoveAll ->
                      go if errors then errors else null
                
                console.log 'Running flow...'
                context.executeAllCells yes, (status, errors) ->
                  console.log "Flow finished with status: #{status}"
                  if status is 'failed'
                    window._phantom_errors_ = errors
                  window._phantom_running_ = no

                setTimeout waitForFlow, 2000

          console.log 'Starting tests...'
          window._phantom_errors_ = null
          window._phantom_started_ = yes
          runPacks (error) ->
            if error
              console.log 'Error running packs'
              console.log JSON.stringify error, null, 2
            else
              console.log 'Finished running all packs'
            window._phantom_exit_ = yes
          no

    waitFor test, ->
      errors = page.evaluate -> window._phantom_errors_
      if errors
        console.log JSON.stringify errors, null, 2
        console.log 'ERROR: One or more flows failed to complete'
        phantom.exit 1
      else
        console.log 'Success! All flows ran to completion!'
        phantom.exit 0
  else
    console.log 'ERROR: Unable to access network.'
    phantom.exit 1


