H2O.ScalaIntpOutput = (_, _go, _result) ->
  _scalaIntpView = signal null

  createScalaIntpView = (result) ->
    session_id: result.session_id

  _scalaIntpView (createScalaIntpView _result)

  defer _go

  scalaIntpView: _scalaIntpView
  template: 'flow-scala-intp-output'


