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

checkSparklingWater = (context) ->
    context.onSparklingWater = false
    $.ajax
        url: "/3/Metadata/endpoints"
        type: 'GET'
        dataType: 'json'
        success: (response) ->
            for route in response.routes
                if route.url_pattern is '/3/scalaint'
                    context.onSparklingWater = true
        async: false

if window?.$?
  $ ->
    context = {}
    checkSparklingWater context
    window.flow = Flow.Application context, H2O.Routines
    H2O.Application context
    ko.applyBindings window.flow
    context.ready()
    context.initialized()
  
