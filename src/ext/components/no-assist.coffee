H2O.NoAssist = (_, _go) ->
  defer _go
  showAssist: -> _.insertAndExecuteCell 'cs', 'assist'
  template: 'flow-no-assist'

