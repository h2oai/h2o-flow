import { removeCell } from './removeCell';

export function mergeCellBelow(_) {
  let nextCell;
  const cells = _.cells();
  if (_.selectedCellIndex !== cells.length - 1) {
    nextCell = cells[_.selectedCellIndex + 1];
    if (_.selectedCell.type() === nextCell.type()) {
      nextCell.input(`${_.selectedCell.input()}\n${nextCell.input()}`);
      removeCell(_);
    }
  }
}
