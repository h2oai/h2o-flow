{ link, signal, signals } = require("../modules/dataflow")

confirmDialog = require('../components/confirm-dialog')
alertDialog = require('../components/alert-dialog')

exports.init = (_) ->
  _dialog = signal null

  showDialog = (ctor, args, _go) ->
    responded = no
    go = (response) ->
      unless responded
        responded = yes
        $dialog.modal 'hide'
        _go response if _go

    _dialog dialog = ctor.apply null, [_].concat(args).concat go

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
    showDialog confirmDialog, [ message, opts ], go

  link _.alert, (message, opts, go) ->
    showDialog alertDialog, [ message, opts ], go

  dialog: _dialog
  template: (dialog) -> 'flow-' + dialog.template
