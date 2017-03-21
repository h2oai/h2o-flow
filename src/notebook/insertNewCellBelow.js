import { insertBelow } from './insertBelow';
import { createCell } from './createCell';

export function insertNewCellBelow(_) {
  return insertBelow(_, createCell(_, 'cs'));
}
