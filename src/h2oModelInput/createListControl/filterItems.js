export function filterItems(
  force,
  _searchTerm,
  _ignoreNATerm,
  _lastUsedSearchTerm,
  _lastUsedIgnoreNaTerm,
  _entries,
  _currentPage,
  _filteredItems,
  MaxItemsPerPage,
  _visibleItems
) {
  const lodash = window._;
  let entry;
  let filteredItems;
  let hide;
  let i;
  let missingPercent;
  let _i;
  let _len;
  let _ref;
  if (force == null) {
    force = false;
  }
  const searchTerm = _searchTerm().trim();
  const ignoreNATerm = _ignoreNATerm().trim();
  if (force || searchTerm !== _lastUsedSearchTerm || ignoreNATerm !== _lastUsedIgnoreNaTerm) {
    filteredItems = [];
    _ref = _entries();
    for (i = _i = 0, _len = _ref.length; _i < _len; i = ++_i) {
      entry = _ref[i];
      missingPercent = parseFloat(ignoreNATerm);
      hide = false;
      if (searchTerm !== '' && entry.value.toLowerCase().indexOf(searchTerm.toLowerCase()) === -1) {
        hide = true;
      } else if (!lodash.isNaN(missingPercent) && missingPercent !== 0 && entry.missingPercent <= missingPercent) {
        hide = true;
      }
      if (!hide) {
        filteredItems.push(entry);
      }
    }
    _lastUsedSearchTerm = searchTerm;
    _lastUsedIgnoreNaTerm = ignoreNATerm;
    _currentPage(0);
    _filteredItems(filteredItems);
  }
  const start = _currentPage() * MaxItemsPerPage;
  _visibleItems(_filteredItems().slice(start, start + MaxItemsPerPage));
}
