import { insertBelow } from './insertBelow';
import { createCell } from './createCell';

export function insertCellBelowAndRun(_, type, input) {
  const cell = insertBelow(_, createCell(_, type, input));
  cell.execute();
  return cell;
}
