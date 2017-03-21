import { insertCell } from './insertCell';

export function undoLastDelete(_) {
  if (_.lastDeletedCell) {
    insertCell(_, _.selectedCellIndex + 1, _.lastDeletedCell);
  }
  _.lastDeletedCell = null;
  return _.lastDeletedCell;
}
