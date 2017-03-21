import { selectCell } from './selectCell';

export default function selectPreviousCell(_) {
  let cells;
  if (_.selectedCellIndex !== 0) {
    cells = _.cells();
    selectCell(
          _,
          cells[_.selectedCellIndex - 1]
        );
  }
      // prevent arrow keys from scrolling the page
  return false;
}
