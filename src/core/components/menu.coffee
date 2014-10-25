Flow.Menu = (_, _items) ->
  createMenuItem = (name, item) ->
    name: name
    description: item.description
    icon: "fa fa-#{item.icon} flow-icon"
    execute: -> _.insertAndExecuteCell 'cs', name

  routines: (createMenuItem name, item for name, item of _items)
  template: 'flow-menu'

