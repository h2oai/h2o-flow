applicationContext = require("./application-context")
proxy = require('./proxy')

exports.init = (_) ->
  applicationContext.init _
  proxy.init _

