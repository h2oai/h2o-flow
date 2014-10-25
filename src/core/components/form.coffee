Flow.Form = (_, _form) ->
  form: _form
  template: 'flow-form'
  templateOf: (control) -> control.template

