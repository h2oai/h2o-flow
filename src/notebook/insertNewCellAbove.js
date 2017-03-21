import { insertAbove } from './insertAbove';
import { createCell } from './createCell';

export function insertNewCellAbove(_) {
  return insertAbove(_, createCell(_, 'cs'));
}
