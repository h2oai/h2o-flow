import { insertAbove } from './insertAbove';
import { createCell } from './createCell';

export function insertCellAbove(_, type, input) {
  return insertAbove(_, createCell(_, type, input));
}
