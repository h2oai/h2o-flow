import { insertAbove } from './insertAbove';
import { createCell } from './createCell';

export function insertCellAboveAndRun(_, type, input) {
  const cell = insertAbove(_, createCell(_, type, input));
  cell.execute();
  return cell;
}
