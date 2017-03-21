import { switchToCommandMode } from './switchToCommandMode';
import { runCellAndSelectBelow } from './runCellAndSelectBelow';
import { runCell } from './runCell';
import { runCellAndInsertBelow } from './runCellAndInsertBelow';
import { splitCell } from './splitCell';
import { saveNotebook } from './saveNotebook';

export default function createEditModeKeyboardShortcuts() {
    //
    // Edit Mode (press Enter to enable)
    //
  const editModeKeyboardShortcuts = [
      // Tab : code completion or indent
      // Shift-Tab : tooltip
      // Cmd-] : indent
      // Cmd-[ : dedent
      // Cmd-a : select all
      // Cmd-z : undo
      // Cmd-Shift-z : redo
      // Cmd-y : redo
      // Cmd-Up : go to cell start
      // Cmd-Down : go to cell end
      // Opt-Left : go one word left
      // Opt-Right : go one word right
      // Opt-Backspace : del word before
      // Opt-Delete : del word after
    [
      'esc',
      'command mode',
      switchToCommandMode,
    ],
    [
      'ctrl+m',
      'command mode',
      switchToCommandMode,
    ],
    [
      'shift+enter',
      'run cell, select below',
      runCellAndSelectBelow,
    ],
    [
      'ctrl+enter',
      'run cell',
      runCell,
    ],
    [
      'alt+enter',
      'run cell, insert below',
      runCellAndInsertBelow,
    ],
    [
      'ctrl+shift+-',
      'split cell',
      splitCell,
    ],
    [
      'mod+s',
      'save notebook',
      saveNotebook,
    ],
  ];
  return editModeKeyboardShortcuts;
}
