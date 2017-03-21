export function convertCellToMarkdown(_) {
  console.log('arguments passed to convertCellToMarkdown', arguments);
  _.selectedCell.type('md');
  return _.selectedCell.execute();
}
