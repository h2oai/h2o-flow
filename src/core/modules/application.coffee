growl = require("./growl")
analytics = require('./analytics')
autosave = require("./autosave")
routines = require("./../../ext/modules/routines")
sandbox = require('./sandbox')
notebook = require('../components/notebook')
renderers = require('./renderers')

exports.init = (_) ->
  _sandbox = sandbox _, routines.init _
  #TODO support external renderers
  _renderers = renderers.init _, _sandbox
  # analytics _
  growl.init _
  autosave.init _
  _notebook = notebook.init _, _renderers

  context: _
  sandbox: _sandbox
  view: _notebook
  async: require('./async')
