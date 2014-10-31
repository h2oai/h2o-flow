class FlowError extends Error
  constructor: (@message, @cause) ->
    @name = 'FlowError'
    error = new Error()
    if error.stack
      @stack = error.stack
    else
      @stack = printStackTrace()

Flow.Error = FlowError

