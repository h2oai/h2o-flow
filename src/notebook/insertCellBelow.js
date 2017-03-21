import { insertBelow } from './insertBelow';
import { createCell } from './createCell';

export function insertCellBelow(_, type, input) {
  return insertBelow(_, createCell(_, type, input));
}
