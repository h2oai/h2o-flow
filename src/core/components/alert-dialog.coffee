lodash = require('lodash')

util = require('../modules/util')

module.exports = (_, _message, _opts={}, _go) ->

  lodash.defaults _opts,
    title: 'Alert'
    acceptCaption: 'OK'

  accept = -> _go yes

  title: _opts.title
  acceptCaption: _opts.acceptCaption
  message: util.multilineTextToHTML _message
  accept: accept
  template: 'alert-dialog'
