export default function clearCell(_) {
  _.selectedCell.clear();
  return _.selectedCell.autoResize();
}
