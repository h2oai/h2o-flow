H2O.Assist = (_, _items) ->
  createAssistItem = (name, item) ->
    name: name
    description: item.description
    icon: "fa fa-#{item.icon} flow-icon"
    execute: -> _.insertAndExecuteCell 'cs', name

  routines: (createAssistItem name, item for name, item of _items)
  template: 'flow-assist'

