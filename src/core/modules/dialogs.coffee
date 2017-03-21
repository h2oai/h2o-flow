Flow.Dialogs = (_) ->
  _dialog = signal null

  showDialog = (ctor, args, _go) ->
    responded = no
    go = (response) ->
      unless responded
        responded = yes
        $dialog.modal 'hide'
        _go response if _go

    _dialog dialog = apply ctor, null, [_].concat(args).concat go

    $dialog = $ "##{dialog.template}"
    $dialog.modal()
    $dialog.on 'hidden.bs.modal', (e) ->
      unless responded
        responded = yes
        _dialog null
        _go null if _go
    return

  link _.dialog, (ctor, args..., go) ->
    showDialog ctor, args, go

  link _.confirm, (message, opts, go) ->
    showDialog Flow.ConfirmDialog, [ message, opts ], go

  link _.alert, (message, opts, go) ->
    showDialog Flow.AlertDialog, [ message, opts ], go

  dialog: _dialog
  template: (dialog) -> 'flow-' + dialog.template

