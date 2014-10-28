Flow.Coffeescript = (_, guid, sandbox) ->
  _kernel = Flow.CoffeescriptKernel

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
      _kernel.safetyWrapCoffeescript guid
      _kernel.compileCoffeescript
      _kernel.parseJavascript
      _kernel.createRootScope sandbox
      _kernel.removeHoistedDeclarations
      _kernel.rewriteJavascript sandbox
      _kernel.generateJavascript
      _kernel.compileJavascript
      _kernel.executeJavascript sandbox, show
    ]
    (Flow.Async.pipe tasks) input, (error) ->
      output.error error if error
      output.end()

      cellResult = sandboxResult.result()
      if cellResult
        if isFunction cellResult
          if isRoutine cellResult
            show cellResult()
          else
            evaluate cellResult
        else
          output.close Flow.ObjectBrowser 'result', cellResult

  render.isCode = yes
  render

