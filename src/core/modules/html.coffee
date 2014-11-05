compile = (template, type) ->
  if 0 <= index = template.indexOf ' '
    tmpl = template.substr 0, index
    attrs = template.substr index
  else
    tmpl = template

  [ name, classes... ] = tmpl.split /\.+/g
  if 0 is name.indexOf '#'
    id = name.substr 1
    name = 'div'

  beginTag = "<#{name}"
  beginTag += " id='#{id}'" if id
  beginTag += " class='#{classes.join ' '}'" if classes.length
  beginTag += attrs if attrs
  beginTag += ">"
  closeTag = "</#{name}>"

  if type is '='
    (content) -> beginTag + content + closeTag
  else
    (contents) -> beginTag + (contents.join '') + closeTag

Flow.HTML =
  template: (templates...) ->
    for template in templates
      if 0 is index = template.indexOf '='
        compile (template.substr 1), '='
      else
        compile template
  render: (name, html) ->
    el = document.createElement name
    el.innerHTML = html if html
    el

