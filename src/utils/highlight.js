export function highlight(code, lang) {
  if (window.hljs) {
    return window.hljs.highlightAuto(code, [lang]).value;
  }
  return code;
}
