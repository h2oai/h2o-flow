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


if window?.$?
  $ ->
    window.flow = flow = Flow.Application do Flow.ApplicationContext
    ko.applyBindings flow
    flow.context.ready()
  
