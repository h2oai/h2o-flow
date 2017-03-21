export function convertCellToRaw(_) {
  _.selectedCell.type('raw');
  return _.selectedCell.execute();
}
