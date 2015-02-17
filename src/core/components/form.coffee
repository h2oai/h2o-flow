Flow.Form = (_, _form, _go) ->

  defer _go

  form: _form
  template: 'flow-form'
  templateOf: (control) -> control.template

