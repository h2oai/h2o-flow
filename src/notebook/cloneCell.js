import { createCell } from './createCell';

export function cloneCell(_, cell) {
  return createCell(_, cell.type(), cell.input());
}
