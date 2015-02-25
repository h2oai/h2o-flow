Flow.AlertDialog = (_, _message, _opts={}, _go) ->

  defaults _opts,
    title: 'Alert'
    acceptCaption: 'OK'

  accept = -> _go yes

  title: _opts.title
  acceptCaption: _opts.acceptCaption
  message: Flow.Util.multilineTextToHTML _message
  accept: accept
  template: 'alert-dialog'
