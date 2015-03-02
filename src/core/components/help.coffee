_homeMarkdown = """
<blockquote> 
Using Flow for the first time?
<br/>
<div style='margin-top:10px'>
  <button type='button' data-action='assist' class='flow-button'><i class='fa fa-support'></i><span>Assist Me!</span>
  </button>
</div>
</blockquote> 

##### Topics

###### General

- <a href='#' data-action='about'>About Flow</a>
- <a href='#' data-action='getting-started'>Getting Started</a>

###### H<sub>2</sub>O REST API

- <a href='#' data-action='endpoints'>Routes</a>
- <a href='#' data-action='schemas'>Schemas</a>

"""

_aboutMarkdown = """
*H<sub>2</sub>O Flow* is a web-based interactive computational environment where you can combine code execution, text, mathematics, plots and rich media into a single document, much like <a href="http://ipython.org/notebook.html" target="_blank">IPython Notebooks</a>.

Flow is a *modal* editor, which means that you are either in *edit mode* or *command mode*.  A *Flow* is composed of a series of executable *cells*. Each *cell* has an input and one or more outputs.
"""

_gettingStartedMarkdown = """
To get started, just memorize these six simple keyboard shortcuts: <kbd>enter</kbd>, <kbd>esc</kbd>, <kbd>ctrl</kbd><kbd>enter</kbd>, <kbd>a</kbd>, <kbd>b</kbd> and <kbd>d</kbd><kbd>d</kbd>

- To edit a cell, press <kbd>enter</kbd> to get into *edit mode*.
- When you're done editing, press <kbd>esc</kbd> to get back into *command mode*. 
- To execute a cell, press <kbd>ctrl</kbd> <kbd>enter</kbd>
- <kbd>a</kbd> adds a new cell <u>a</u>bove the current cell.
- <kbd>b</kbd> adds a new cell <u>b</u>elow the current cell.
- <kbd>d</kbd><kbd>d</kbd> <u>d</u>eletes the current cell. Yes, you need to press <kbd>d</kbd> twice.

Finally, to view a full list of keyboard shortcuts, press <kbd>h</kbd>, or type <code><a href='#' data-action='assist'>assist</a></code> <kbd>ctrl</kbd><kbd>enter</kbd> to dive into H<sub>2</sub>O!
"""


Flow.Help = (_) ->
  _content = signal null
  _history = [] # [DOMElement]
  _historyIndex = -1
  _canGoBack = signal no
  _canGoForward = signal no

  goTo = (index) ->
    content = _history[_historyIndex = index]

    $ 'a, button', $ content
      .each (i) ->
        $a = $ @
        if action = $a.attr 'data-action'
          $a.click -> performAction action, $a

    _content content
    _canGoForward _historyIndex < _history.length - 1
    _canGoBack _historyIndex > 0
    return

  goBack = ->
    goTo _historyIndex - 1 if _historyIndex > 0

  goForward = ->
    goTo _historyIndex + 1 if _historyIndex < _history.length - 1

  displayHtml = (content) ->
    if _historyIndex < _history.length - 1
      splice _history, _historyIndex + 1, _history.length - (_historyIndex + 1), content
    else
      _history.push content
    goTo _history.length - 1

  displayMarkdown = (md) ->
    displayHtml Flow.HTML.render 'div', "#{marked md}"

  performAction = (action, $el) ->
    switch action
      when 'assist'
        _.insertAndExecuteCell 'cs', 'assist'

      when 'about'
        displayMarkdown _aboutMarkdown

      when 'getting-started'
        displayMarkdown _gettingStartedMarkdown

      when 'endpoints'
        _.requestEndpoints (error, response) ->
          unless error
            displayEndpoints response.routes

      when 'endpoint'
        routeIndex = $el.attr 'data-index'
        _.requestEndpoint routeIndex, (error, response) ->
          unless error
            displayEndpoint head response.routes

      when 'schemas'
        _.requestSchemas (error, response) ->
          unless error
            displaySchemas sortBy response.schemas, (schema) -> schema.name

      when 'schema'
        schemaName = $el.attr 'data-schema'
        _.requestSchema schemaName, (error, response) ->
          unless error
            displaySchema head response.schemas

    return
  
  displayEndpoints = (routes) ->
    [ div, mark, h5, p, action, code ] = Flow.HTML.template 'div', 'mark', 'h5', 'p', "a href='#' data-action='endpoint' data-index='$1'", 'code'
    els = [
      mark 'API'
      h5 'List of Routes'
    ]
    for route, routeIndex in routes
      els.push p (action (code route.http_method + " " + route.url_pattern), routeIndex) + "<br/>" + route.summary

    displayHtml Flow.HTML.render 'div', div els
    return

  goHome = ->
    displayMarkdown _homeMarkdown

  displayEndpoint = (route) ->
    [ div, mark, h5, h6, p, action, code ] = Flow.HTML.template 'div', 'mark', 'h5', 'h6', 'p', "a href='#' data-action='schema' data-schema='$1'", 'code'

    displayHtml Flow.HTML.render 'div', div [
      mark 'Route'

      h5 route.url_pattern

      h6 'Method'
      p code route.http_method

      h6 'Summary'
      p route.summary

      h6 'Parameters'
      p if route.path_params?.length then join route.path_params, ', ' else '-'

      h6 'Input Schema'
      p action (code route.input_schema), route.input_schema

      h6 'Output Schema'
      p action (code route.output_schema), route.output_schema
    ]

  displaySchemas = (schemas) ->

    [ div, h5, ul, li, variable, mark, code, action ] = Flow.HTML.template 'div', 'h5', 'ul', 'li', 'var', 'mark', 'code', "a href='#' data-action='schema' data-schema='$1'"

    els = [
      mark 'API'
      h5 'List of Schemas'
      ul (li "#{action (code schema.name), schema.name} #{variable escape schema.type}" for schema in schemas)
    ]

    displayHtml Flow.HTML.render 'div', div els

  displaySchema = (schema) ->
    [ div, mark, h5, h6, p, code, variable, small ] = Flow.HTML.template 'div', 'mark', 'h5', 'h6', 'p', 'code', 'var', 'small'

    content = [
      mark 'Schema'
      h5 "#{schema.name} (#{escape schema.type})"
      h6 'Fields'
    ]
    
    for field in schema.fields when field.name isnt '__meta'
      content.push p "#{variable field.name}#{if field.required then '*' else ''} #{code escape field.type}<br/>#{small field.help}"

    displayHtml Flow.HTML.render 'div', div content


  link _.ready, ->
    goHome()

  content: _content
  goHome: goHome
  goBack: goBack
  canGoBack: _canGoBack
  goForward: goForward
  canGoForward: _canGoForward

