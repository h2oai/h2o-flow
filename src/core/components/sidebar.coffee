Flow.Sidebar = (_, cells) ->
  _mode = signal 'help'

  _outline = Flow.Outline _, cells
  _isOutlineMode = lift _mode, (mode) -> mode is 'outline'
  switchToOutline = -> _mode 'outline'

  _browser = Flow.Browser _
  _isBrowserMode = lift _mode, (mode) -> mode is 'browser'
  switchToBrowser = -> _mode 'browser'

  _clipboard = Flow.Clipboard _
  _isClipboardMode = lift _mode, (mode) -> mode is 'clipboard'
  switchToClipboard = -> _mode 'clipboard'

  _help = Flow.Help _
  _isHelpMode = lift _mode, (mode) -> mode is 'help'
  switchToHelp = -> _mode 'help'

  link _.ready, ->
    link _.showHelp, ->
      switchToHelp()

    link _.showClipboard, ->
      switchToClipboard()

    link _.showBrowser, ->
      switchToBrowser()

    link _.showOutline, ->
      switchToOutline()

  outline: _outline
  isOutlineMode: _isOutlineMode
  switchToOutline: switchToOutline
  browser: _browser
  isBrowserMode: _isBrowserMode
  switchToBrowser: switchToBrowser
  clipboard: _clipboard
  isClipboardMode: _isClipboardMode
  switchToClipboard: switchToClipboard
  help: _help
  isHelpMode: _isHelpMode
  switchToHelp: switchToHelp
