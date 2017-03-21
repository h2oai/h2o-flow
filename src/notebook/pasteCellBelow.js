import { insertCell } from './insertCell';
import { cloneCell } from './cloneCell';

export function pasteCellBelow(_) {
  if (_.clipboardCell) {
    return insertCell(_, _.selectedCellIndex + 1, cloneCell(_, _.clipboardCell));
  }
}
