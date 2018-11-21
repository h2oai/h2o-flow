{ defer, map } = require('lodash')

module.exports = (_, _go, _plot) ->

  defer _go
  
  plot: _plot
  template: 'flow-plot-output'
