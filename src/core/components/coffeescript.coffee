{ isRoutine, isFunction } = require('lodash')

{ signal, link } = require('../modules/dataflow')
async = require('../modules/async')
kernel = require('../modules/coffeescript-kernel')
FlowError = require('../modules/flow-error')
objectBrowser = require('./object-browser')

module.exports = (_, guid, sandbox) ->

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
    outputBuffer = async.createBuffer []
    sandbox.results[guid] = cellResult =
      result: signal null
      outputs: outputBuffer
    
    evaluate = (ft) ->
      if ft?.isFuture
        ft (error, result) ->
          if error
            output.error new FlowError 'Error evaluating cell', error
            output.end()
          else
            if result?._flow_?.render
              output.data result._flow_.render -> output.end()
            else
              output.data objectBrowser _, (-> output.end()), 'output', result
      else
        output.data objectBrowser _, (-> output.end()), 'output', ft

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
      kernel.executeJavascript sandbox, print
    ]
    (async.pipe tasks) input, (error) ->
      output.error error if error

      result = cellResult.result()
      if isFunction result
        if isRoutine result
          print result()
        else
          evaluate result
      else
        output.close objectBrowser _, (-> output.end()), 'result', result

  render.isCode = yes
  render

