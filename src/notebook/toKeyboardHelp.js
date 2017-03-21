export default function toKeyboardHelp(shortcut) {
  const lodash = window._;
  const seq = shortcut[0];
  const caption = shortcut[1];
  const keystrokes = lodash.map(seq.split(/\+/g), key => `<kbd>${key}</kbd>`).join(' ');
  return {
    keystrokes,
    caption,
  };
}
