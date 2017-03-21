import { selectCell } from './selectCell';

export function selectNextCell(_) {
  const cells = _.cells();
  if (_.selectedCellIndex !== cells.length - 1) {
    selectCell(
          _,
          cells[_.selectedCellIndex + 1]
        );
  }
      // prevent arrow keys from scrolling the page
  return false;
}
