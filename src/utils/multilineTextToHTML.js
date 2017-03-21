export function multilineTextToHTML(text) {
  const lodash = window._;
  const EOL = '\n';
  return lodash.map(text.split(EOL), str => lodash.escape(str)).join('<br/>');
}
