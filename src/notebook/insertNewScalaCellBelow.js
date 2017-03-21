import { insertBelow } from './insertBelow';
import { createCell } from './createCell';

export function insertNewScalaCellBelow(_) {
  return insertBelow(_, createCell(_, 'sca'));
}
