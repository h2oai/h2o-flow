export default function executeNextCell(
  _,
  cells,
  cellIndex,
  cellCount,
  go
) {
  let cell;
        // will be false if user-aborted
  if (_.isRunningAll()) {
    cell = cells.shift();
    if (cell) {
            // Scroll immediately without affecting selection state.
      cell.scrollIntoView(true);
      cellIndex++;
      _.runningCaption(`Running cell ${cellIndex} of ${cellCount}`);
      _.runningPercent(`${Math.floor(100 * cellIndex / cellCount)}%`);
      _.runningCellInput(cell.input());
            // TODO Continuation should be EFC, and passing an error should abort 'run all'
      return cell.execute(errors => {
        if (errors) {
          return go('failed', errors);
        }
        return executeNextCell(
          _,
          cells,
          cellIndex,
          cellCount,
          go
        );
      });
    }
    return go('done');
  }
  return go('aborted');
}
