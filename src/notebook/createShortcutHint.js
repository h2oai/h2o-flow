export default function createShortcutHint(shortcut) {
  const lodash = window._;
  return `<span style=\'float:right\'>${lodash.map(shortcut, key => `<kbd>${key}</kbd>`).join(' ')}</span>`;
}
