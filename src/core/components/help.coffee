marked = require('../modules/marked')
{ map, filter, head, escape, sortBy } = require('lodash')

{ lift, link, signal, signals } = require("../modules/dataflow")
html = require('../modules/html')
util = require('../../ext/modules/util')

_catalog = null
_index = {}
_homeContent = null

_homeMarkdown = """
<blockquote>
Using Flow for the first time?
<br/>
<div style='margin-top:10px'>
  <button type='button' data-action='get-flow' data-pack-name='examples' data-flow-name='QuickStartVideos.flow' class='flow-button'><i class='fa fa-file-movie-o'></i><span>Quickstart Videos</span>
  </button>
</div>
</blockquote>

Or, <a href='#' data-action='get-pack' data-pack-name='examples'>view example Flows</a> to explore and learn H<sub>2</sub>O.

###### Star H2O on Github!

<span class="github-btn">
    <a class="gh-btn" href="https://github.com/h2oai/h2o-3/" target="_blank">
      <span class="gh-ico"></span><span class="gh-text">Star</span>
    </a>
</span>
<br/>

###### General

%HELP_TOPICS%

###### Examples

Flow packs are a great way to explore and learn H<sub>2</sub>O. Try out these Flows and run them in your browser.<br/><a href='#' data-action='get-packs'>Browse installed packs...</a>

###### H<sub>2</sub>O REST API

- <a href='#' data-action='endpoints'>Routes</a>
- <a href='#' data-action='schemas'>Schemas</a>

"""

exports.init = (_) ->
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
      _history.splice _historyIndex + 1, _history.length - (_historyIndex + 1), content
    else
      _history.push content
    goTo _history.length - 1

  fixImageSources = (html) ->
    html.replace /\s+src\s*\=\s*\"images\//g, ' src="help/images/'

  performAction = (action, $el) ->
    switch action
      when 'help'
        topic = _index[$el.attr 'data-topic']
        _.requestHelpContent topic.name, (error, content) ->
          [ div, mark, h5, h6 ] = html.template 'div', 'mark', 'h5', 'h6'
          contents = [
            mark 'Help'
            h5 topic.title
            fixImageSources div content
          ]

          # render a TOC if this topic has children
          if topic.children.length
            contents.push h6 'Topics'
            contents.push buildToc topic.children 

          displayHtml html.render 'div', div contents

      when 'assist'
        _.insertAndExecuteCell 'cs', 'assist'

      when 'get-packs'
        _.requestPacks (error, packNames) ->
          unless error
            displayPacks filter packNames, (packName) -> packName isnt 'test'

      when 'get-pack'
        packName = $el.attr 'data-pack-name'
        _.requestPack packName, (error, flowNames) ->
          unless error
            displayFlows packName, flowNames

      when 'get-flow'
        _.confirm 'This action will replace your active notebook.\nAre you sure you want to continue?', { acceptCaption: 'Load Notebook', declineCaption: 'Cancel' }, (accept) ->
          if accept
            packName = $el.attr 'data-pack-name'
            flowName = $el.attr 'data-flow-name'
            if util.validateFileExtension flowName, '.flow'
              _.requestFlow packName, flowName, (error, flow) ->
                unless error
                  _.open (util.getFileBaseName flowName, '.flow'), flow

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

  buildToc = (nodes) ->
    [ ul, li, a ] = html.template 'ul', 'li', "a href='#' data-action='help' data-topic='$1'"
    ul map nodes, (node) -> li a node.title, node.name

  buildTopics = (index, topics) ->
    for topic in topics
      index[topic.name] = topic
      if topic.children.length
        buildTopics index, topic.children
    return

  displayPacks = (packNames) ->
    [ div, mark, h5, p, i, a ] = html.template 'div', 'mark', 'h5', 'p', 'i.fa.fa-folder-o', "a href='#' data-action='get-pack' data-pack-name='$1'"

    displayHtml html.render 'div', div [
      mark 'Packs'
      h5 'Installed Packs'
      div map packNames, (packName) -> p [ i(), a packName, packName ]
    ]
    return

  displayFlows = (packName, flowNames) ->
    [ div, mark, h5, p, i, a ] = html.template 'div', 'mark', 'h5', 'p', 'i.fa.fa-file-text-o', "a href='#' data-action='get-flow' data-pack-name='#{packName}' data-flow-name='$1'"

    displayHtml html.render 'div', div [
      mark 'Pack'
      h5 packName 
      div map flowNames, (flowName) -> p [ i(), a flowName, flowName ]
    ]
    return

  
  displayEndpoints = (routes) ->
    [ div, mark, h5, p, action, code ] = html.template 'div', 'mark', 'h5', 'p', "a href='#' data-action='endpoint' data-index='$1'", 'code'
    els = [
      mark 'API'
      h5 'List of Routes'
    ]
    for route, routeIndex in routes
      els.push p (action (code route.http_method + " " + route.url_pattern), routeIndex) + "<br/>" + route.summary

    displayHtml html.render 'div', div els
    return

  goHome = ->
    displayHtml html.render 'div', _homeContent

  displayEndpoint = (route) ->
    [ div, mark, h5, h6, p, action, code ] = html.template 'div', 'mark', 'h5', 'h6', 'p', "a href='#' data-action='schema' data-schema='$1'", 'code'

    displayHtml html.render 'div', div [
      mark 'Route'

      h5 route.url_pattern

      h6 'Method'
      p code route.http_method

      h6 'Summary'
      p route.summary

      h6 'Parameters'
      p if route.path_params?.length then route.path_params.join ', ' else '-'

      h6 'Input Schema'
      p action (code route.input_schema), route.input_schema

      h6 'Output Schema'
      p action (code route.output_schema), route.output_schema
    ]

  displaySchemas = (schemas) ->

    [ div, h5, ul, li, variable, mark, code, action ] = html.template 'div', 'h5', 'ul', 'li', 'var', 'mark', 'code', "a href='#' data-action='schema' data-schema='$1'"

    els = [
      mark 'API'
      h5 'List of Schemas'
      ul (li "#{action (code schema.name), schema.name} #{variable escape schema.type}" for schema in schemas)
    ]

    displayHtml html.render 'div', div els

  displaySchema = (schema) ->
    [ div, mark, h5, h6, p, code, variable, small ] = html.template 'div', 'mark', 'h5', 'h6', 'p', 'code', 'var', 'small'

    content = [
      mark 'Schema'
      h5 "#{schema.name} (#{escape schema.type})"
      h6 'Fields'
    ]
    
    for field in schema.fields when field.name isnt '__meta'
      content.push p "#{variable field.name}#{if field.required then '*' else ''} #{code escape field.type}<br/>#{small field.help}"

    displayHtml html.render 'div', div content

  initialize = (catalog) ->
    _catalog = catalog
    buildTopics _index, _catalog
    _homeContent = (marked _homeMarkdown).replace '%HELP_TOPICS%', buildToc _catalog 
    goHome()

  link _.ready, ->
    _.requestHelpIndex (error, catalog) ->
      initialize catalog unless error

  content: _content
  goHome: goHome
  goBack: goBack
  canGoBack: _canGoBack
  goForward: goForward
  canGoForward: _canGoForward

