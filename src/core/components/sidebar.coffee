Flow.Sidebar = (_) ->
  _mode = signal 'help'

  _help = Flow.Help _
  _isHelpMode = lift _mode, (mode) -> mode is 'help'
  switchToHelp = -> _mode 'help'

  _clipboard = Flow.Clipboard _
  _isClipboardMode = lift _mode, (mode) -> mode is 'clipboard'
  switchToClipboard = -> _mode 'clipboard'

  link _.ready, ->
    link _.showHelp, ->
      switchToHelp()

    link _.showClipboard, ->
      switchToClipboard()

  help: _help
  isHelpMode: _isHelpMode
  switchToHelp: switchToHelp
  clipboard: _clipboard
  isClipboardMode: _isClipboardMode
  switchToClipboard: switchToClipboard
