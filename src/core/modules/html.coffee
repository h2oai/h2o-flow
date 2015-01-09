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

  if name is ''
    name = 'div'

  beginTag = "<#{name}"
  beginTag += " id='#{id}'" if id
  beginTag += " class='#{classes.join ' '}'" if classes.length
  beginTag += attrs if attrs
  beginTag += ">"
  closeTag = "</#{name}>"

  if type is '='
    (content) -> beginTag + (if content isnt null and content isnt undefined then content else '') + closeTag
  else if type is '+'
    (content, arg0) -> #TODO add more args as necessary
      tag = replace beginTag, '{0}', arg0
      tag + content + closeTag
  else
    (contents) -> beginTag + (contents.join '') + closeTag

_templateCache = {}
Flow.HTML =
  template: (templates...) ->
    for template in templates
      if cached = _templateCache[template]
        cached
      else
        type = charAt template, 0
        if type is '=' or type is '+'
          _templateCache[template] = compile (template.substr 1), type
        else
          _templateCache[template] = compile template
  render: (name, html) ->
    el = document.createElement name
    if html
      if isString html
        el.innerHTML = html
      else
        el.appendChild html
    el

