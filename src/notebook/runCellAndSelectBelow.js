import { selectNextCell } from './selectNextCell';

// ipython has inconsistent behavior here.
// seems to be doing runCellAndInsertBelow if executed on the lowermost cell.
export function runCellAndSelectBelow(_) {
  _.selectedCell.execute(() => selectNextCell(_));
  return false;
}
