H2O.Help = (_) ->
  executeHelp: -> _.insertAndExecuteCell 'cs', 'help'
  executeAssist: -> _.insertAndExecuteCell 'cs', 'assist'
  template: 'flow-help'
