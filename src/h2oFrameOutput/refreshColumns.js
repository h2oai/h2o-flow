/* eslint-disable */

import renderFrame from './renderFrame';

export default function refreshColumns(_, pageIndex) {
  console.log('arguments from refreshColumns', arguments);
  const searchTerm = _.columnNameSearchTerm();
  if (searchTerm !== _.lastUsedSearchTerm) {
    pageIndex = 0;
  }
  const startIndex = pageIndex * _.maxItemsPerPage;
  const itemCount = startIndex + _.maxItemsPerPage < _.frame.total_column_count ? _.maxItemsPerPage : _.frame.total_column_count - startIndex;
  return _.requestFrameSummarySliceE(_, _.frame.frame_id.name, searchTerm, startIndex, itemCount, (error) => {
    if (error) {
        // empty
        // TODO
    } else {
      _.lastUsedSearchTerm = searchTerm;
      _.currentPage(pageIndex);
      return renderFrame(_);
    }
  });
}
