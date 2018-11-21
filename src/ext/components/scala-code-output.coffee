{ defer, map } = require('lodash')

{ react, lift, link, signal, signals } = require("../../core/modules/dataflow")

module.exports = (_, _go, _result) ->

  _scalaCodeView = signal null

  _scalaResponseVisible = signal false
  _scalaLinkText = signal "Show Scala Response"

  _scalaCodeVisible = signal false
  _scalaCodeLinkText = signal "Show Executed Code"

  createScalaCodeView = (result) ->
    code: result.code
    output: result.output
    response: result.response
    status: result.status
    scalaResponseVisible: _scalaResponseVisible
    scalaLinkText: _scalaLinkText
    scalaCodeVisible: _scalaCodeVisible
    scalaCodeLinkText: _scalaCodeLinkText

    toggleResponseVisibility: ->
      _scalaResponseVisible not _scalaResponseVisible()
      if _scalaResponseVisible()
        _scalaLinkText "Hide Scala Response"
      else
        _scalaLinkText "Show Scala Response"

    toggleCodeVisibility: ->
      _scalaCodeVisible not _scalaCodeVisible()
      if _scalaCodeVisible()
        _scalaCodeLinkText "Hide Executed Code"
      else
        _scalaCodeLinkText "Show Executed Code"

  _scalaCodeView (createScalaCodeView _result)

  defer _go

  scalaCodeView: _scalaCodeView
  template: 'flow-scala-code-output'




