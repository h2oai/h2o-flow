export function moveCellUp(_) {
  let cells;
  if (_.selectedCellIndex !== 0) {
    cells = _.cells();
    _.cells.splice(_.selectedCellIndex, 1);
    _.selectedCellIndex--;
    _.cells.splice(_.selectedCellIndex, 0, _.selectedCell);
  }
}
