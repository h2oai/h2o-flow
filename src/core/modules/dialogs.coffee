Flow.Dialogs = (_) ->

  _alertDialog = signal null
  _confirmDialog = signal null

  showDialog = (dialogSignal, ctor, args..., _go) ->
    responded = no
    go = (response) ->
      unless responded
        responded = yes
        $dialog.modal 'hide'
        _go response if _go

    dialogSignal dialog = apply ctor, null, [_].concat(args).concat go

    $dialog = $ "##{dialog.template}Dialog"
    $dialog.modal()
    $dialog.on 'hidden.bs.modal', (e) ->
      unless responded
        responded = yes
        _go null if _go
    return

  link _.dialog, (id, data, go) ->

  link _.confirm, (message, opts, go) ->
    showDialog _confirmDialog, Flow.ConfirmDialog, message, opts, go

  link _.alert, (message, opts, go) ->
    showDialog _alertDialog, Flow.AlertDialog, message, opts, go

  alertDialog: _alertDialog
  confirmDialog: _confirmDialog

