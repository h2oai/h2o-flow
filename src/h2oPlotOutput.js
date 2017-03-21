export function h2oPlotOutput(_, _go, _plot) {
  const lodash = window._;
  lodash.defer(_go);
  return {
    plot: _plot,
    template: 'flow-plot-output',
  };
}

