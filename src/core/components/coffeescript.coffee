Flow.Coffeescript = (_, guid, sandbox) ->
  _kernel = Flow.CoffeescriptKernel

  print = (arg) ->
    if arg isnt print
      sandbox.results[guid].outputs arg
    print

  isRoutine = (f) ->
    for name, routine of sandbox.routines when f is routine
      return yes
    return no

  # XXX special-case functions so that bodies are not printed with the raw renderer.
  render = (input, output) ->
    sandbox.results[guid] = cellResult =
      result: signal null
      outputs: outputBuffer = Flow.Async.createBuffer []
    
    evaluate = (ft) ->
      if ft?.isFuture
        ft (error, result) ->
          if error
            output.error new Flow.Error 'Error evaluating cell', error
          else
            if ft.render
              ft.render result, (error, result) ->
                if error
                  output.error new Flow.Error 'Error rendering output', error
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
      _kernel.executeJavascript sandbox, print
    ]
    (Flow.Async.pipe tasks) input, (error) ->
      output.error error if error
      output.end()

      result = cellResult.result()
      if isFunction result
        if isRoutine result
          print result()
        else
          evaluate result
      else
        output.close Flow.ObjectBrowser 'result', result

  render.isCode = yes
  render

