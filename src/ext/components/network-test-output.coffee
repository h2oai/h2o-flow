{ defer, map } = require('lodash')

{ react, lift, link, signal, signals } = require("../../core/modules/dataflow")

module.exports = (_, _go, _testResult) ->
  _result = signal null
  render = _.plot (g) ->
    g(
      g.select()
      g.from _.inspect 'result', _testResult
    )

  render (error, vis) ->
    if error
      console.debug error
    else
      _result vis.element

  defer _go

  result: _result
  template: 'flow-network-test-output'
      
