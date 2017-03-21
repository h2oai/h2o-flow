import { insertCell } from './insertCell';

export function insertAbove(_, cell) {
  return insertCell(_, _.selectedCellIndex, cell);
}
