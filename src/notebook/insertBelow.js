import { insertCell } from './insertCell';

export function insertBelow(_, cell) {
  return insertCell(_, _.selectedCellIndex + 1, cell);
}
