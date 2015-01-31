Flow.Growl = (_) ->
  link _.growl, (message, type) ->
    if type
      $.bootstrapGrowl message, type: type
    else
      $.bootstrapGrowl message
    

