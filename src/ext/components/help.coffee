H2O.Help = (_) ->
  executeHelp: -> _.insertAndExecuteCell 'cs', 'help'
  executeMenu: -> _.insertAndExecuteCell 'cs', 'menu'
  template: 'flow-help'
