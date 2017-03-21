import { insertAbove } from './insertAbove';
import { createCell } from './createCell';

export function insertNewScalaCellAbove(_) {
  return insertAbove(_, createCell(_, 'sca'));
}
