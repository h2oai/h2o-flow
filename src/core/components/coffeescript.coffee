assist = (_, routines, routine) ->
  switch routine
    when routines.importFiles
      Flow.Async.renderable Flow.Async.noop, (ignore, go) ->
        go null, Flow.ImportFilesInput _
    when routines.help, routines.menu, routines.buildModel, routines.getFrames, routines.getModels, routines.getJobs
      # parameter-less routines
      routine()
    else
      Flow.Async.renderable Flow.Async.noop, (ignore, go) ->
        go null, Flow.NoAssistView _

Flow.Coffeescript = (_, guid, sandbox) ->
  kernel = Flow.CoffeescriptKernel

  show = (arg) ->
    if arg isnt show
      sandbox.results[guid].outputs arg
    show

  isRoutine = (f) ->
    for name, routine of sandbox.routines when f is routine
      return yes
    return no

  # XXX special-case functions so that bodies are not printed with the raw renderer.
  render = (input, output) ->
    sandbox.results[guid] = sandboxResult =
      result: signal null
      outputs: outputBuffer = Flow.Async.createBuffer []

    #
    # XXX need separate implicit buffer
    #
    # Following case produces 1, timeout_id, 2, 3, 4...
    #
    # values = [1 .. 10]
    # process = ->
    #   value = values.shift()
    #   if value
    #     show value
    #     _.delay process, 1000
    # process()
    #
    
    evaluate = (ft) ->
      if ft?.isFuture
        ft (error, result) ->
          if error
            output.error Flow.Exception 'Error evaluating cell', error
          else
            if ft.render
              ft.render result, (error, result) ->
                if error
                  output.error Flow.Exception 'Error rendering output', error
                else
                  output.data result 
            else
              #XXX pick smarter renderers based on content
              output.data Flow.ObjectBrowser 'output', ft
      else
        output.data Flow.ObjectBrowser 'output', ft

    outputBuffer.subscribe evaluate

    tasks = [
      kernel.safetyWrapCoffeescript guid
      kernel.compileCoffeescript
      kernel.parseJavascript
      kernel.createRootScope sandbox
      kernel.removeHoistedDeclarations
      kernel.rewriteJavascript sandbox
      kernel.generateJavascript
      kernel.compileJavascript
      kernel.executeJavascript sandbox, show
    ]
    (Flow.Async.pipe tasks) input, (error) ->
      output.error error if error
      output.end()

      cellResult = sandboxResult.result()
      if cellResult
        if isFunction cellResult
          if isRoutine cellResult
            show assist _, sandbox.routines, cellResult
          else
            evaluate cellResult
        else
          output.close Flow.ObjectBrowser 'result', cellResult

  render.isCode = yes
  render

