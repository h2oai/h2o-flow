export function convertCellToHeading(_, level) {
  return () => {
    _.selectedCell.type(`h${level}`);
    return _.selectedCell.execute();
  };
}
