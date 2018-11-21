class FlowError extends Error
  constructor: (@message, @cause) ->
    super()
    @name = 'FlowError'
    if @cause?.stack
      @stack = @cause.stack
    else
      error = new Error()
      if error.stack
        @stack = error.stack
      else
        @stack = printStackTrace()

module.exports = FlowError
