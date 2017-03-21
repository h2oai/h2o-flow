import { insertNewCellBelow } from './insertNewCellBelow';

export function runCellAndInsertBelow(_) {
  _.selectedCell.execute(() => insertNewCellBelow(_));
  return false;
}
