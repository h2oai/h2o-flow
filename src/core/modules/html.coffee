Flow.HTML =
  template: diecut
  render: (name, html) ->
    el = document.createElement name
    if html
      if isString html
        el.innerHTML = html
      else
        el.appendChild html
    el

