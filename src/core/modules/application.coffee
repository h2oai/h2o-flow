Flow.Application = (_, routines) ->
  Flow.ApplicationContext _
  _routines = routines _
  _sandbox = Flow.Sandbox _, _routines
  #XXX support external renderers
  _renderers = Flow.Renderers _, _sandbox
  _notebook = Flow.Notebook _, _renderers
  _growl = Flow.Growl _
  
  context: _
  sandbox: _sandbox
  view: _notebook

