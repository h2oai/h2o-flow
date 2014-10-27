Flow.Application = (_) ->
  _sandbox = Flow.Sandbox _
  _renderers = Flow.Renderers _, _sandbox
  _repl = Flow.Notebook _, _renderers

  Flow.H2O _
  
  context: _
  sandbox: _sandbox
  view: _repl

