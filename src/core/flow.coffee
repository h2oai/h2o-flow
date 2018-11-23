# 
# TODO
#
# XXX how does cell output behave when a widget throws an exception?
# XXX GLM case is failing badly. Investigate. Should catch/handle gracefully.
#
# integrate with groc
# tooltips on celltype flags
# arrow keys cause page to scroll - disable those behaviors
# scrollTo() behavior

application = require('./modules/application')
context = require("./modules/application-context")
h2oApplication = require('../ext/modules/application')

ko = require('./modules/knockout')

getContextPath = (_) ->
    if process.env.NODE_ENV == "development"
      console.debug "Development mode, using localhost:54321"
      _.ContextPath = "http://localhost:54321/"
    else
      _.ContextPath = "/"
      $.ajax
          url: window.referrer
          type: 'GET'
          success: (data, status, xhr) ->
              if xhr.getAllResponseHeaders().search(/x-h2o-context-path/i) != -1
                  _.ContextPath = xhr.getResponseHeader('X-h2o-context-path')
          async: false

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
