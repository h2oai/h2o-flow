import { appendCell } from './appendCell';
import { createCell } from './createCell';

export function appendCellAndRun(_, type, input) {
  const cell = appendCell(_, createCell(_, type, input));
  console.log('cell from appendCellAndRun', cell);
  cell.execute();
  return cell;
}
