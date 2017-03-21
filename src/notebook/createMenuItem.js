import createShortcutHint from './createShortcutHint';

export default function createMenuItem(label, action, shortcut) {
  const lodash = window._;
  const kbds = shortcut ? createShortcutHint(shortcut) : '';
  return {
    label: `${lodash.escape(label)}${kbds}`,
    action,
  };
}
