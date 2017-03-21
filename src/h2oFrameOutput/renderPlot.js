export default function renderPlot(container, render) {
  return render((error, vis) => {
    if (error) {
      return console.debug(error);
    }
    return container(vis.element);
  });
}
