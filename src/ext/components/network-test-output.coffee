H2O.NetworkTestOutput = (_, _go, _testResult) ->
  _result = signal null
  render = _.plot (g) ->
    g(
      g.table()
      g.from _.inspect 'result', _testResult
    )

  render (error, vis) ->
    if error
      debug error
    else
      _result vis.element

  defer _go

  result: _result
  template: 'flow-network-test-output'
      
