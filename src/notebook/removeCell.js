import { selectCell } from './selectCell';

export function removeCell(_) {
  const lodash = window._;
  let removedCell;
  const cells = _.cells();
  if (cells.length > 1) {
    if (_.selectedCellIndex === cells.length - 1) {
          // TODO call dispose() on this cell
      removedCell = lodash.head(_.cells.splice(_.selectedCellIndex, 1));
      selectCell(
            _,
            cells[_.selectedCellIndex - 1]
          );
    } else {
          // TODO call dispose() on this cell
      removedCell = lodash.head(_.cells.splice(_.selectedCellIndex, 1));
      selectCell(
            _,
            cells[_.selectedCellIndex]
          );
    }
    if (removedCell) {
      _.saveClip('trash', removedCell.type(), removedCell.input());
    }
  }
}
