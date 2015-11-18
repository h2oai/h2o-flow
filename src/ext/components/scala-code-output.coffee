H2O.ScalaCodeOutput = (_, _go, _result) ->
  _scalaCodeView = signal null

  createScalaCodeView = (result) ->
    output: result.output
    response: result.response
    status: result.status

  _scalaCodeView (createScalaCodeView _result)

  defer _go

  scalaCodeView: _scalaCodeView
  template: 'flow-scala-code-output'


