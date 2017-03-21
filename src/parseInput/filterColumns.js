import { makePage } from './makePage';

export function filterColumns(_activePage, _columns, _columnNameSearchTerm) {
  const lodash = window._;
  return _activePage(makePage(0, lodash.filter(_columns(), column => column.name().toLowerCase().indexOf(_columnNameSearchTerm().toLowerCase()) > -1)));
}
