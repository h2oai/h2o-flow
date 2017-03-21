export function flowMarkdown(_) {
  const marked = window.marked;
  const render = (input, output) => {
    let error;
    try {
      return output.data({
        html: marked(input.trim() || '(No content)'),
        template: 'flow-html',
      });
    } catch (_error) {
      error = _error;
      return output.error(error);
    } finally {
      output.end();
    }
  };
  render.isCode = false;
  return render;
}

