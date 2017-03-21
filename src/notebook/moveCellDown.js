export function moveCellDown(_) {
  const cells = _.cells();
  if (_.selectedCellIndex !== cells.length - 1) {
    _.cells.splice(_.selectedCellIndex, 1);
    _.selectedCellIndex++;
    _.cells.splice(_.selectedCellIndex, 0, _.selectedCell);
  }
}
