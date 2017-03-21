import { makePage } from './makePage';

export function goToPreviousPage(_activePage) {
  const currentPage = _activePage();
  if (currentPage.index > 0) {
    return _activePage(makePage(currentPage.index - 1, currentPage.columns));
  }
}
