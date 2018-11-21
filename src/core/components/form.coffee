{ act, react, lift, merge, isSignal, signal, signals } = require("../../core/modules/dataflow")
{ defer } = require('lodash')

module.exports = (_, _form, _go) ->

  defer _go

  form: _form
  template: 'flow-form'
  templateOf: (control) -> control.template
