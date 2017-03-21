import { checkConsistency } from './checkConsistency';

export function selectCell(
  _,
  target,
  scrollIntoView,
  scrollImmediately
) {
  const lodash = window._;
  if (scrollIntoView == null) {
    scrollIntoView = true;
  }
  if (scrollImmediately == null) {
    scrollImmediately = false;
  }
  if (_.selectedCell === target) {
    return;
  }
  if (_.selectedCell) {
    _.selectedCell.isSelected(false);
  }
  _.selectedCell = target;
  // TODO also set focus so that tabs don't jump to the first cell
  _.selectedCell.isSelected(true);
  _.selectedCellIndex = _.cells.indexOf(_.selectedCell);
  checkConsistency(_.cells);
  if (scrollIntoView) {
    lodash.defer(() => _.selectedCell.scrollIntoView(scrollImmediately));
  }
}
