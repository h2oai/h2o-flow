import createMenuItem from './createMenuItem';
import { runCell } from './runCell';
import { menuDivider } from './menuDivider';
import { cutCell } from './cutCell';
import { copyCell } from './copyCell';
import { pasteCellAbove } from './pasteCellAbove';
import { pasteCellBelow } from './pasteCellBelow';
import { deleteCell } from './deleteCell';
import { undoLastDelete } from './undoLastDelete';
import { moveCellUp } from './moveCellUp';
import { moveCellDown } from './moveCellDown';
import { insertNewCellAbove } from './insertNewCellAbove';
import { insertNewCellBelow } from './insertNewCellBelow';
import { toggleInput } from './toggleInput';
import { toggleOutput } from './toggleOutput';
import clearCell from './clearCell';
import { insertNewScalaCellAbove } from './insertNewScalaCellAbove';
import { insertNewScalaCellBelow } from './insertNewScalaCellBelow';

export default function createMenuCell(_) {
  const __slice = [].slice;
  let menuCell = [
    createMenuItem('Run Cell', runCell.bind(this, _), [
      'ctrl',
      'enter',
    ]),
    menuDivider,
    createMenuItem('Cut Cell', cutCell.bind(this, _), ['x']),
    createMenuItem('Copy Cell', copyCell.bind(this, _), ['c']),
    createMenuItem('Paste Cell Above', pasteCellAbove.bind(this, _), [
      'shift',
      'v',
    ]),
    createMenuItem('Paste Cell Below', pasteCellBelow.bind(this, _), ['v']),
      // TODO createMenuItem('Paste Cell and Replace', pasteCellandReplace, true),
    createMenuItem('Delete Cell', deleteCell.bind(this, _), [
      'd',
      'd',
    ]),
    createMenuItem('Undo Delete Cell', undoLastDelete.bind(this, _), ['z']),
    menuDivider,
    createMenuItem('Move Cell Up', moveCellUp.bind(this, _), [
      'ctrl',
      'k',
    ]),
    createMenuItem('Move Cell Down', moveCellDown.bind(this, _), [
      'ctrl',
      'j',
    ]),
    menuDivider,
    createMenuItem('Insert Cell Above', insertNewCellAbove.bind(this, _), ['a']),
    createMenuItem('Insert Cell Below', insertNewCellBelow.bind(this, _), ['b']),
      // TODO createMenuItem('Split Cell', splitCell),
      // TODO createMenuItem('Merge Cell Above', mergeCellAbove, true),
      // TODO createMenuItem('Merge Cell Below', mergeCellBelow),
    menuDivider,
    createMenuItem('Toggle Cell Input', toggleInput.bind(this, _)),
    createMenuItem('Toggle Cell Output', toggleOutput.bind(this, _), ['o']),
    createMenuItem('Clear Cell Output', clearCell.bind(this, _)),
  ];
  const menuCellSW = [
    menuDivider,
    createMenuItem('Insert Scala Cell Above', insertNewScalaCellAbove.bind(this, _)),
    createMenuItem('Insert Scala Cell Below', insertNewScalaCellBelow.bind(this, _)),
  ];
  if (_.onSparklingWater) {
    menuCell = __slice.call(menuCell).concat(__slice.call(menuCellSW));
  }
  return menuCell;
}
