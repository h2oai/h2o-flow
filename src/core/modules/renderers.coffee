heading = require("../components/heading")
markdown = require("../components/markdown")
coffeescript = require("../components/coffeescript")
raw = require("../components/raw")

exports.init = (_, _sandbox) ->
  h1: -> heading _, 'h1'
  h2: -> heading _, 'h2'
  h3: -> heading _, 'h3'
  h4: -> heading _, 'h4'
  h5: -> heading _, 'h5'
  h6: -> heading _, 'h6'
  md: -> markdown _
  cs: (guid) -> coffeescript _, guid, _sandbox
  sca: (guid) -> coffeescript _, guid, _sandbox
  raw: -> raw _
