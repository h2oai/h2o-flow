import { makePage } from './makePage';

export function goToNextPage(_activePage) {
  const currentPage = _activePage();
  return _activePage(makePage(currentPage.index + 1, currentPage.columns));
}
