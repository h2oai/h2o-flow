export function flowRaw(_) {
  const render = (input, output) => {
    output.data({
      text: input,
      template: 'flow-raw',
    });
    return output.end();
  };
  render.isCode = false;
  return render;
}

