import { insertCell } from './insertCell';
import { createCell } from './createCell';

export function splitCell(_) {
  let cursorPosition;
  let input;
  let left;
  let right;
  if (_.selectedCell.isActive()) {
    input = _.selectedCell.input();
    if (input.length > 1) {
      cursorPosition = _.selectedCell.getCursorPosition();
      if (
            cursorPosition > 0 &&
            cursorPosition < input.length - 1
          ) {
        left = input.substr(0, cursorPosition);
        right = input.substr(cursorPosition);
        _.selectedCell.input(left);
        insertCell(_, _.selectedCellIndex + 1, createCell(_, 'cs', right));
        _.selectedCell.isActive(true);
      }
    }
  }
}
