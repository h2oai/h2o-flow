H2O.PlotInput = (_, config) ->
  _table = config.data
  _types = [ 'point', 'line', 'area', 'interval' ]
  _variables = map _table.variables, (variable) -> variable.label

  _type = signal null
  _x = signal null
  _y = signal null
  _color = signal null
  _canPlot = lift _type, _x, _y, (type, x, y) -> type and x and y
  
  plot = ->
    if color = _color()
      _.insertAndExecuteCell 'cs', """
      plot
        data: inspect #{stringify _table.label}, #{_table.meta.origin}
        type: '#{_type()}'
        x: #{stringify _x()}
        y: #{stringify _y()}
        color: #{stringify color}
      """
    else
      _.insertAndExecuteCell 'cs', """
      plot
        data: inspect #{stringify _table.label}, #{_table.meta.origin}
        type: '#{_type()}'
        x: #{stringify _x()}
        y: #{stringify _y()}
      """


  types: _types
  type: _type
  variables: _variables
  x: _y
  y: _x
  color: _color
  plot: plot
  canPlot: _canPlot
  template: 'flow-plot-input'

