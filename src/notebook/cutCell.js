import { copyCell } from './copyCell';
import { removeCell } from './removeCell';

export function cutCell(_) {
  copyCell(_);
  return removeCell(_);
}
