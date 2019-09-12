# 
# TODO
#
# XXX how does cell output behave when a widget throws an exception?
# XXX GLM case is failing badly. Investigate. Should catch/handle gracefully.
#
# tooltips on celltype flags
# arrow keys cause page to scroll - disable those behaviors
# scrollTo() behavior

application = require('./modules/application')
context = require("./modules/application-context")
h2oApplication = require('../ext/modules/application')

ko = require('./modules/knockout')

getContextPath = (_) ->
    url = window.location.toString()
    parts = url.split('/')
    # remove flow/index.html from end of the URL
    contextPathParts = parts.splice(0, parts.length - 2)
    _.ContextPath = contextPathParts.join('/')

checkSparklingWater = (context) ->
    context.onSparklingWater = false
    $.ajax
        url: context.ContextPath + "3/Metadata/endpoints"
        type: 'GET'
        dataType: 'json'
        success: (response) ->
            for route in response.routes
                if route.url_pattern is '/3/scalaint'
                    context.onSparklingWater = true
        async: false

$ ->
  console.debug "Starting Flow"
  getContextPath context
  checkSparklingWater context
  window.flow = application.init context
  h2oApplication.init context
  ko.applyBindings window.flow
  context.ready()
  context.initialized()
  console.debug "Initialization complete", context
