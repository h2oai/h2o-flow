import { insertCell } from './insertCell';
import { cloneCell } from './cloneCell';

export function pasteCellAbove(_) {
  if (_.clipboardCell) {
    return insertCell(_, _.selectedCellIndex, cloneCell(_, _.clipboardCell));
  }
}
