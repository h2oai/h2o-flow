import { selectCell } from './selectCell';

export function insertCell(_, index, cell) {
  _.cells.splice(index, 0, cell);
  selectCell(_, cell);
  return cell;
}
