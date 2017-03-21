import { switchToEditMode } from './switchToEditMode';
import { convertCellToCode } from './convertCellToCode';
import { convertCellToMarkdown } from './convertCellToMarkdown';
import { convertCellToRaw } from './convertCellToRaw';
import { convertCellToHeading } from './convertCellToHeading';
import selectPreviousCell from './selectPreviousCell';
import { selectNextCell } from './selectNextCell';
import { moveCellUp } from './moveCellUp';
import { moveCellDown } from './moveCellDown';
import { insertNewCellAbove } from './insertNewCellAbove';
import { insertNewCellBelow } from './insertNewCellBelow';
import { cutCell } from './cutCell';
import { copyCell } from './copyCell';
import { pasteCellAbove } from './pasteCellAbove';
import { pasteCellBelow } from './pasteCellBelow';
import { undoLastDelete } from './undoLastDelete';
import { deleteCell } from './deleteCell';
import { mergeCellBelow } from './mergeCellBelow';
import { saveNotebook } from './saveNotebook';
import { toggleOutput } from './toggleOutput';
import displayKeyboardShortcuts from './displayKeyboardShortcuts';
import { convertCellToScala } from './convertCellToScala';

// (From IPython Notebook keyboard shortcuts dialog)
//
// The IPython Notebook has two different keyboard input modes.
// Edit mode allows you to type code/text into a cell
// and is indicated by a green cell border.
// Command mode binds the keyboard to notebook level
// actions and is indicated by a grey cell border.
//
// Command Mode (press Esc to enable)
//
export default function createNormalModeKeyboardShortcuts(_) {
  const normalModeKeyboardShortcuts = [
    [
      'enter',
      'edit mode',
      switchToEditMode,
    ],
      // [ 'shift+enter', 'run cell, select below', runCellAndSelectBelow ]
      // [ 'ctrl+enter', 'run cell', runCell ]
      // [ 'alt+enter', 'run cell, insert below', runCellAndInsertBelow ]
    [
      'y',
      'to code',
      convertCellToCode,
    ],
    [
      'm',
      'to markdown',
      convertCellToMarkdown,
    ],
    [
      'r',
      'to raw',
      convertCellToRaw,
    ],
    [
      '1',
      'to heading 1',
      convertCellToHeading(_, 1),
    ],
    [
      '2',
      'to heading 2',
      convertCellToHeading(_, 2),
    ],
    [
      '3',
      'to heading 3',
      convertCellToHeading(_, 3),
    ],
    [
      '4',
      'to heading 4',
      convertCellToHeading(_, 4),
    ],
    [
      '5',
      'to heading 5',
      convertCellToHeading(_, 5),
    ],
    [
      '6',
      'to heading 6',
      convertCellToHeading(_, 6),
    ],
    [
      'up',
      'select previous cell',
      selectPreviousCell,
    ],
    [
      'down',
      'select next cell',
      selectNextCell,
    ],
    [
      'k',
      'select previous cell',
      selectPreviousCell,
    ],
    [
      'j',
      'select next cell',
      selectNextCell,
    ],
    [
      'ctrl+k',
      'move cell up',
      moveCellUp,
    ],
    [
      'ctrl+j',
      'move cell down',
      moveCellDown,
    ],
    [
      'a',
      'insert cell above',
      insertNewCellAbove,
    ],
    [
      'b',
      'insert cell below',
      insertNewCellBelow,
    ],
    [
      'x',
      'cut cell',
      cutCell,
    ],
    [
      'c',
      'copy cell',
      copyCell,
    ],
    [
      'shift+v',
      'paste cell above',
      pasteCellAbove,
    ],
    [
      'v',
      'paste cell below',
      pasteCellBelow,
    ],
    [
      'z',
      'undo last delete',
      undoLastDelete,
    ],
    [
      'd d',
      'delete cell (press twice)',
      deleteCell,
    ],
    [
      'shift+m',
      'merge cell below',
      mergeCellBelow,
    ],
    [
      's',
      'save notebook',
      saveNotebook,
    ],
      // [ 'mod+s', 'save notebook', saveNotebook ]
      // [ 'l', 'toggle line numbers' ]
    [
      'o',
      'toggle output',
      toggleOutput,
    ],
      // [ 'shift+o', 'toggle output scrolling' ]
    [
      'h',
      'keyboard shortcuts',
      displayKeyboardShortcuts,
    ],
      // [ 'i', 'interrupt kernel (press twice)' ]
      // [ '0', 'restart kernel (press twice)' ]

  ];

  if (_.onSparklingWater) {
    normalModeKeyboardShortcuts.push([
      'q',
      'to Scala',
      convertCellToScala,
    ]);
  }

  return normalModeKeyboardShortcuts;
}
