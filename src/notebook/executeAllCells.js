import executeNextCell from './executeNextCell';

export default function executeAllCells(_, fromBeginning, go) {
  let cellIndex;
  let cells;
  _.isRunningAll(true);
  cells = _.cells().slice(0);
  const cellCount = cells.length;
  cellIndex = 0;
  if (!fromBeginning) {
    cells = cells.slice(_.selectedCellIndex);
    cellIndex = _.selectedCellIndex;
  }
  return executeNextCell(
    _,
    cells,
    cellIndex,
    cellCount,
    go
  );
}
