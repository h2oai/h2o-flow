export function _plot(render, go) {
  const Flow = window.Flow;
  return render((error, vis) => {
    if (error) {
      return go(new Flow.Error('Error rendering vis.', error));
    }
    return go(null, vis);
  });
}
