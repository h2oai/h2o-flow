import { createControl } from '../createControl';

import { blockSelectionUpdates } from './blockSelectionUpdates';
import { createEntry } from './createEntry';
import { changeSelection } from './changeSelection';

export function createListControl(parameter) {
  const lodash = window._;
  const Flow = window.Flow;
  let _lastUsedIgnoreNaTerm;
  let _lastUsedSearchTerm;
  const MaxItemsPerPage = 100;
  const _searchTerm = Flow.Dataflow.signal('');
  const _ignoreNATerm = Flow.Dataflow.signal('');
  const _values = Flow.Dataflow.signal([]);
  const _selectionCount = Flow.Dataflow.signal(0);
  const _isUpdatingSelectionCount = false;
  const _entries = Flow.Dataflow.lift(_values, values => { // eslint-disable-line arrow-body-style
    return values.map(value => { // eslint-disable-line arrow-body-style
      return createEntry(value, _selectionCount, _isUpdatingSelectionCount);
    });
  });
  const _filteredItems = Flow.Dataflow.signal([]);
  const _visibleItems = Flow.Dataflow.signal([]);
  const _hasFilteredItems = Flow.Dataflow.lift(_filteredItems, entries => entries.length > 0);
  const _currentPage = Flow.Dataflow.signal(0);
  const _maxPages = Flow.Dataflow.lift(_filteredItems, entries => Math.ceil(entries.length / MaxItemsPerPage));
  const _canGoToPreviousPage = Flow.Dataflow.lift(_currentPage, index => index > 0);
  const _canGoToNextPage = Flow.Dataflow.lift(_maxPages, _currentPage, (maxPages, index) => index < maxPages - 1);
  const _searchCaption = Flow.Dataflow.lift(_entries, _filteredItems, _selectionCount, _currentPage, _maxPages, (entries, filteredItems, selectionCount, currentPage, maxPages) => {
    let caption;
    caption = maxPages === 0 ? '' : `Showing page ${(currentPage + 1)} of ${maxPages}.`;
    if (filteredItems.length !== entries.length) {
      caption += ` Filtered ${filteredItems.length} of ${entries.length}.`;
    }
    if (selectionCount !== 0) {
      caption += ` ${selectionCount} ignored.`;
    }
    return caption;
  });
  Flow.Dataflow.react(_entries, () => filterItems(true));
  _lastUsedSearchTerm = null;
  _lastUsedIgnoreNaTerm = null;
  // abstracting this out produces errors
  // this is too tightly coupled
  // defer for now
  const filterItems = force => {
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
  };
  const selectFiltered = () => {
    const entries = _filteredItems();
    blockSelectionUpdates(() => changeSelection(entries, true));
    return _selectionCount(entries.length);
  };
  const deselectFiltered = () => {
    blockSelectionUpdates(() => changeSelection(_filteredItems(), false));
    return _selectionCount(0);
  };
  // depends on `filterItems()`
  const goToPreviousPage = () => {
    if (_canGoToPreviousPage()) {
      _currentPage(_currentPage() - 1);
      filterItems();
    }
  };
  // depends on `filterItems()`
  const goToNextPage = () => {
    if (_canGoToNextPage()) {
      _currentPage(_currentPage() + 1);
      filterItems();
    }
  };
  Flow.Dataflow.react(_searchTerm, lodash.throttle(filterItems, 500));
  Flow.Dataflow.react(_ignoreNATerm, lodash.throttle(filterItems, 500));
  const control = createControl('list', parameter);
  control.values = _values;
  control.entries = _visibleItems;
  control.hasFilteredItems = _hasFilteredItems;
  control.searchCaption = _searchCaption;
  control.searchTerm = _searchTerm;
  control.ignoreNATerm = _ignoreNATerm;
  control.value = _entries;
  control.selectFiltered = selectFiltered;
  control.deselectFiltered = deselectFiltered;
  control.goToPreviousPage = goToPreviousPage;
  control.goToNextPage = goToNextPage;
  control.canGoToPreviousPage = _canGoToPreviousPage;
  control.canGoToNextPage = _canGoToNextPage;
  return control;
}
