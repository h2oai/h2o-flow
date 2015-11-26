H2O.ScalaCodeOutput = (_, _go, _result) ->
  _scalaCodeView = signal null
  _scalaResponseVisible = signal false
  _scalaLinkText = signal "Show Scala Response"
  createScalaCodeView = (result) ->
    output: result.output
    response: result.response
    status: result.status
    scalaResponseVisible: _scalaResponseVisible
    scalaLinkText: _scalaLinkText

    toggleVisibility: ->
      _scalaResponseVisible not _scalaResponseVisible()
      if _scalaResponseVisible()
        _scalaLinkText "Hide Scala Response"
      else
        _scalaLinkText "Show Scala Response"

  _scalaCodeView (createScalaCodeView _result)

  defer _go

  scalaCodeView: _scalaCodeView
  template: 'flow-scala-code-output'


