Flow.ConfirmDialog = (_, _message, _opts={}, _go) ->

  defaults _opts,
    title: 'Alert'
    acceptCaption: 'Yes'
    declineCaption: 'No'

  accept = -> _go yes

  decline = -> _go no

  title: _opts.title
  acceptCaption: _opts.acceptCaption
  declineCaption: _opts.declineCaption
  message: _message
  accept: accept
  decline: decline
  template: 'confirm'

