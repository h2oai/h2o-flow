lodash = require('lodash')
util = require('../modules/util')

module.exports = (_, _message, _opts={}, _go) ->
  lodash.defaults _opts,
    title: 'Confirm'
    acceptCaption: 'Yes'
    declineCaption: 'No'

  accept = -> _go yes

  decline = -> _go no

  title: _opts.title
  acceptCaption: _opts.acceptCaption
  declineCaption: _opts.declineCaption
  message: util.multilineTextToHTML _message
  accept: accept
  decline: decline
  template: 'confirm-dialog'

