import { removeCell } from './removeCell';

export function deleteCell(_) {
  _.lastDeletedCell = _.selectedCell;
  return removeCell(_);
}
