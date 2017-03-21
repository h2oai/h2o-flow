export function runCell(_) {
  _.selectedCell.execute();
  return false;
}
