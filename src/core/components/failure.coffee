traceCauses = (error, causes) ->
  if '[object Error]' is Object::toString.call error
    causes.push error.message
    traceCauses error.cause if error.cause
  return causes

Flow.Failure = (error) ->
  causes = traceCauses error, []
  message = shift causes

  message: message
  stack: error.stack
  causes: causes

