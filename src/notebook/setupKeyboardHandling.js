import createNormalModeKeyboardShortcuts from './createNormalModeKeyboardShortcuts';
import createEditModeKeyboardShortcuts from './createEditModeKeyboardShortcuts';

export default function setupKeyboardHandling(_, mode) {
  const Mousetrap = window.Mousetrap;
  const normalModeKeyboardShortcuts = createNormalModeKeyboardShortcuts(_);
  const editModeKeyboardShortcuts = createEditModeKeyboardShortcuts();
  let caption;
  let f;
  let shortcut;
  let _i;
  let _j;
  let _len;
  let _len1;
  let _ref;
  let _ref1;
  for (_i = 0, _len = normalModeKeyboardShortcuts.length; _i < _len; _i++) {
    _ref = normalModeKeyboardShortcuts[_i];
    shortcut = _ref[0];
    caption = _ref[1];
    f = _ref[2].bind(this, _);
    Mousetrap.bind(shortcut, f);
  }
  for (_j = 0, _len1 = editModeKeyboardShortcuts.length; _j < _len1; _j++) {
    _ref1 = editModeKeyboardShortcuts[_j];
    shortcut = _ref1[0];
    caption = _ref1[1];
    f = _ref1[2].bind(this, _);
    Mousetrap.bindGlobal(shortcut, f);
  }
}
