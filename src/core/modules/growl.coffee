{ link } = require("../modules/dataflow")

exports.init = (_) ->
  # Type should be one of:
  # undefined = info (blue)
  # success (green)
  # warning (orange)
  # danger (red)
  link _.growl, (message, type) ->
    if type
      $.bootstrapGrowl message, type: type
    else
      $.bootstrapGrowl message
