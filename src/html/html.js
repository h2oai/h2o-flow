export function html() {
  const lodash = window._;
  const Flow = window.Flow;
  const diecut = window.diecut;
  if ((typeof window !== 'undefined' && window !== null ? window.diecut : void 0) == null) {
    return;
  }
  Flow.HTML = {
    template: diecut,
    render(name, html) {
      const el = document.createElement(name);
      if (html) {
        if (lodash.isString(html)) {
          el.innerHTML = html;
        } else {
          el.appendChild(html);
        }
      }
      return el;
    },
  };
}
