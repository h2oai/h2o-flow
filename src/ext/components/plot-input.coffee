H2O.PlotInput = (_, _frame) ->
  _types = [ 'point', 'path', 'rect' ]
  _vectors = for vector in _frame.vectors when vector.type is TString or vector.type is TNumber
    vector.label

  _type = signal null
  _x = signal null
  _y = signal null
  _color = signal null
  _canPlot = lift _type, _x, _y, (type, x, y) -> type and x and y
  
  plot = ->
    command = if color = _color()
      """
      plot1 (g) -> g(
        g.#{_type()}(
          g.position #{stringify _x()}, #{stringify _y()}
          g.color #{stringify color}
        )
        g.from inspect #{stringify _frame.label}, #{_frame.metadata.origin}
      )
      """
    else
      """
      plot1 (g) -> g(
        g.#{_type()}(
          g.position #{stringify _x()}, #{stringify _y()}
        )
        g.from inspect #{stringify _frame.label}, #{_frame.metadata.origin}
      )
      """
    _.insertAndExecuteCell 'cs', command


  types: _types
  type: _type
  vectors: _vectors
  x: _x
  y: _y
  color: _color
  plot: plot
  canPlot: _canPlot
  template: 'flow-plot-input'

