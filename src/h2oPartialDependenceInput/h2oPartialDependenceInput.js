import { getModelsRequest } from '../h2oProxy/getModelsRequest';
import { uuid } from '../utils/uuid';
import { blockSelectionUpdates } from '../h2oModelInput/createListControl/blockSelectionUpdates';
import { incrementSelectionCount } from '../h2oModelInput/createListControl/incrementSelectionCount';
import { changeSelection } from '../h2oModelInput/createListControl/changeSelection';

import { flowPreludeFunction } from '../flowPreludeFunction';
const flowPrelude = flowPreludeFunction();

export function h2oPartialDependenceInput(_, _go) {
  const lodash = window._;
  const Flow = window.Flow;

  const _exception = Flow.Dataflow.signal(null);
  const _destinationKey = Flow.Dataflow.signal(`ppd-${uuid()}`);
  const _frames = Flow.Dataflow.signals([]);
  const _models = Flow.Dataflow.signals([]);
  const _selectedModel = Flow.Dataflow.signals(null);
  const _selectedFrame = Flow.Dataflow.signal(null);
  const _useCustomColumns = Flow.Dataflow.signal(false);
  const _columns = Flow.Dataflow.signal([]);
  const _nbins = Flow.Dataflow.signal(20);

  // search and filter functionality
  const _visibleItems = Flow.Dataflow.signal([]);
  const _filteredItems = Flow.Dataflow.signal([]);

  const maxItemsPerPage = 100;

  const _currentPage = Flow.Dataflow.signal(0);
  const _maxPages = Flow.Dataflow.lift(_filteredItems, entries => Math.ceil(entries.length / maxItemsPerPage));
  const _canGoToPreviousPage = Flow.Dataflow.lift(_currentPage, index => index > 0);
  const _canGoToNextPage = Flow.Dataflow.lift(_maxPages, _currentPage, (maxPages, index) => index < maxPages - 1);

  const _selectionCount = Flow.Dataflow.signal(0);

  const _isUpdatingSelectionCount = false;

  const _searchTerm = Flow.Dataflow.signal('');
  const _searchCaption = Flow.Dataflow.lift(_columns, _filteredItems, _selectionCount, _currentPage, _maxPages, (entries, filteredItems, selectionCount, currentPage, maxPages) => {
    let caption;
    if (maxPages === 0) {
      caption = '';
    } else {
      caption = `Showing page ${currentPage + 1} of ${maxPages}.`;
    }
    if (filteredItems.length !== entries.length) {
      caption = caption.concat(` Filtered ${filteredItems.length} of ${entries.length}.`);
    }
    if (selectionCount !== 0) {
      caption = caption.concat(`${selectionCount} selected for PDP calculations.`);
    }
    return caption;
  });

  const _hasFilteredItems = Flow.Dataflow.lift(_columns, entries => entries.length > 0);
  // this is too tightly coupled
  // defer for now
  const filterItems = () => {
    let entry;
    let hide;
    let i;
    let j;
    let len;
    const searchTerm = _searchTerm().trim();
    const filteredItems = [];
    const ref = _columns();
    for (i = j = 0, len = ref.length; j < len; i = ++j) {
      entry = ref[i];
      hide = false;
      if (
        (searchTerm !== '') &&
        entry.value.toLowerCase().indexOf(searchTerm.toLowerCase()) === -1
      ) {
        hide = true;
      }
      if (!hide) {
        filteredItems.push(entry);
      }
    }
    _filteredItems(filteredItems);
    const start = _currentPage() * maxItemsPerPage;
    return _visibleItems(_filteredItems().slice(start, start + maxItemsPerPage));
  };
  Flow.Dataflow.react(_searchTerm, lodash.throttle(filterItems, 500));
  const _selectFiltered = () => {
    const entries = _filteredItems();
    blockSelectionUpdates(() => changeSelection(entries, true));
    return _selectionCount(entries.length);
  };
  const _deselectFiltered = () => {
    blockSelectionUpdates(() => changeSelection(_columns(), false));
    return _selectionCount(0);
  };
  const _goToPreviousPage = () => {
    if (_canGoToPreviousPage()) {
      _currentPage(_currentPage() - 1);
      filterItems();
    }
  };
  const _goToNextPage = () => {
    if (_canGoToNextPage()) {
      _currentPage(_currentPage() + 1);
      filterItems();
    }
  };

  //  a conditional check that makes sure that
  //  all fields in the form are filled in
  //  before the button is shown as active
  const _canCompute = Flow.Dataflow.lift(_destinationKey, _selectedFrame, _selectedModel, _nbins, (dk, sf, sm, nb) => dk && sf && sm && nb);
  const _compute = () => {
    if (!_canCompute()) {
      return;
    }

    // parameters are selections from Flow UI
    // form dropdown menus, text boxes, etc
    let col;
    let cols;
    let i;
    let len;

    cols = '';

    const ref = _columns();
    for (i = 0, len = ref.length; i < len; i++) {
      col = ref[i];
      if (col.isSelected()) {
        cols = `${cols}"${col.value}",`;
      }
    }

    if (cols !== '') {
      cols = `[${cols}]`;
    }

    const opts = {
      destination_key: _destinationKey(),
      model_id: _selectedModel(),
      frame_id: _selectedFrame(),
      cols,
      nbins: _nbins(),
    };

    // assemble a string
    // this contains the function to call
    // along with the options to pass in
    const cs = `buildPartialDependence ${flowPrelude.stringify(opts)}`;

    // insert a cell with the expression `cs`
    // into the current Flow notebook
    // and run the cell
    return _.insertAndExecuteCell('cs', cs);
  };

  const _updateColumns = () => {
    const frameKey = _selectedFrame();
    if (frameKey) {
      return _.requestFrameSummaryWithoutData(_, frameKey, (error, frame) => {
        let columnLabels;
        let columnValues;
        if (!error) {
          columnValues = frame.columns.map(column => column.label);
          columnLabels = frame.columns.map(column => {
            const missingPercent = 100 * column.missing_count / frame.rows;
            const isSelected = Flow.Dataflow.signal(false);
            Flow.Dataflow.react(isSelected, isSelected => {
              if (!_isUpdatingSelectionCount) {
                if (isSelected) {
                  incrementSelectionCount(1, _selectionCount);
                } else {
                  incrementSelectionCount(-1, _selectionCount);
                }
              }
            });
            return {
              isSelected,
              type: column.type === 'enum' ? `enum(${column.domain_cardinality})` : column.type,
              value: column.label,
              missingPercent,
              missingLabel: missingPercent === 0 ? '' : `${Math.round(missingPercent)}% NA`,
            };
          });
          _columns(columnLabels);
          _currentPage(0);
          _searchTerm('');
          return filterItems();
        }
      });
    }
  };

  _.requestFrames(_, (error, frames) => {
    let frame;
    if (error) {
      return _exception(new Flow.Error('Error fetching frame list.', error));
    }
    return _frames((() => {
      let _i;
      let _len;
      const _results = [];
      for (_i = 0, _len = frames.length; _i < _len; _i++) {
        frame = frames[_i];
        if (!frame.is_text) {
          _results.push(frame.frame_id.name);
        }
      }
      return _results;
    })());
  });
  getModelsRequest(_, (error, models) => {
    let model;
    if (error) {
      return _exception(new Flow.Error('Error fetching model list.', error));
    }
    return _models((() => {
      let _i;
      let _len;
      const _results = [];
      // TODO use models directly
      for (_i = 0, _len = models.length; _i < _len; _i++) {
        model = models[_i];
        _results.push(model.model_id.name);
      }
      return _results;
    })());
  });
  lodash.defer(_go);
  return {
    exception: _exception,
    destinationKey: _destinationKey,
    frames: _frames,
    models: _models,
    selectedModel: _selectedModel,
    selectedFrame: _selectedFrame,
    columns: _columns,
    visibleItems: _visibleItems,
    useCustomColumns: _useCustomColumns,
    nbins: _nbins,
    compute: _compute,
    updateColumns: _updateColumns,
    canCompute: _canCompute,
    // values for the search and filter functionality
    // of the column selection control
    hasFilteredItems: _hasFilteredItems,
    selectFiltered: _selectFiltered,
    deselectFiltered: _deselectFiltered,
    goToPreviousPage: _goToPreviousPage,
    goToNextPage: _goToNextPage,
    canGoToPreviousPage: _canGoToPreviousPage,
    canGoToNextPage: _canGoToNextPage,
    searchTerm: _searchTerm,
    searchCaption: _searchCaption,
    template: 'flow-partial-dependence-input',
  };
}

