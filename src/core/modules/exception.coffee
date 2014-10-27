Flow.Exception = (message, cause) -> 
  if cause and not cause.stack
    cause.stack = if stack = printStackTrace()
      # lop off exception() and printStackTrace() calls from stack
      (if stack.length > 3 then stack.slice 3 else stack).join '\n'
    else
      null
    cause.stack = stack
  message: message
  cause: cause

