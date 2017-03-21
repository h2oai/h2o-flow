export function h2oFrameDataOutput(_, _go, _frame) {
  const lodash = window._;
  const Flow = window.Flow;
  let _lastUsedSearchTerm;
  const MaxItemsPerPage = 20;
  const _data = Flow.Dataflow.signal(null);
  const _columnNameSearchTerm = Flow.Dataflow.signal(null);
  const _currentPage = Flow.Dataflow.signal(0);
  const _maxPages = Flow.Dataflow.signal(Math.ceil(_frame.total_column_count / MaxItemsPerPage));
  const _canGoToPreviousPage = Flow.Dataflow.lift(_currentPage, index => index > 0);
  const _canGoToNextPage = Flow.Dataflow.lift(_maxPages, _currentPage, (maxPages, index) => index < maxPages - 1);
  console.log('_ from h2oFrameDataOutput', _);
  const renderPlot = (container, render) => render((error, vis) => {
    if (error) {
      return console.debug(error);
    }
    return container(vis.element);
  });
  const renderFrame = frame => renderPlot(_data, _.plot(g => g(g.select(), g.from(_.inspect('data', frame)))));
  _lastUsedSearchTerm = null;
  const refreshColumns = pageIndex => {
    const searchTerm = _columnNameSearchTerm();
    if (searchTerm !== _lastUsedSearchTerm) {
      pageIndex = 0;
    }
    const startIndex = pageIndex * MaxItemsPerPage;
    const itemCount = startIndex + MaxItemsPerPage < _frame.total_column_count ? MaxItemsPerPage : _frame.total_column_count - startIndex;
    return _.requestFrameDataE(_, _frame.frame_id.name, searchTerm, startIndex, itemCount, (error, frame) => {
      if (error) {
        // empty
      } else {
        _lastUsedSearchTerm = searchTerm;
        _currentPage(pageIndex);
        return renderFrame(frame);
      }
    });
  };
  const goToPreviousPage = () => {
    const currentPage = _currentPage();
    if (currentPage > 0) {
      refreshColumns(currentPage - 1);
    }
  };
  const goToNextPage = () => {
    const currentPage = _currentPage();
    if (currentPage < _maxPages() - 1) {
      refreshColumns(currentPage + 1);
    }
  };
  Flow.Dataflow.react(_columnNameSearchTerm, lodash.throttle(refreshColumns, 500));
  renderFrame(_frame);
  lodash.defer(_go);
  return {
    key: _frame.frame_id.name,
    data: _data,
    columnNameSearchTerm: _columnNameSearchTerm,
    canGoToPreviousPage: _canGoToPreviousPage,
    canGoToNextPage: _canGoToNextPage,
    goToPreviousPage,
    goToNextPage,
    template: 'flow-frame-data-output',
  };
}

