Flow.Application = (_, routines) ->
  Flow.ApplicationContext _
  _sandbox = Flow.Sandbox _, routines _
  #TODO support external renderers
  _renderers = Flow.Renderers _, _sandbox
  Flow.Analytics _
  Flow.Growl _
  Flow.Autosave _
  _notebook = Flow.Notebook _, _renderers
  
  context: _
  sandbox: _sandbox
  view: _notebook

