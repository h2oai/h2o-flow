import { insertCell } from './insertCell';

export function appendCell(_, cell) {
  return insertCell(_, _.cells().length, cell);
}
