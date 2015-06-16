H2O.FrameDataOutput = (_, _go, _frame) ->
  MaxItemsPerPage = 20
  _data = signal null
  _columnNameSearchTerm = signal null
  _currentPage = signal 0
  _maxPages = signal 10000 #TODO FIXME 
  _canGoToPreviousPage = lift _currentPage, (index) -> index > 0
  _canGoToNextPage = lift _maxPages, _currentPage, (maxPages, index) -> index < maxPages - 1

  renderPlot = (container, render) ->
    render (error, vis) ->
      if error
        debug error
      else
        container vis.element

  renderFrame = (frame) ->
    renderPlot _data, _.plot (g) ->
      g(
        g.select()
        g.from _.inspect 'data', frame
      )

  _lastUsedSearchTerm = null 
  refreshColumns = (pageIndex) ->
    searchTerm = _columnNameSearchTerm()
    if searchTerm isnt _lastUsedSearchTerm
      pageIndex = 0
       
    _.requestFrameDataE _frame.frame_id.name, searchTerm, pageIndex * MaxItemsPerPage, MaxItemsPerPage, (error, frame) ->
      if error
        #TODO
      else
        _lastUsedSearchTerm = searchTerm
        _currentPage pageIndex
        renderFrame frame
       
  goToPreviousPage = ->
    currentPage = _currentPage()
    if currentPage > 0
      refreshColumns currentPage - 1
    return

  goToNextPage = ->
    currentPage = _currentPage()
    if currentPage < _maxPages() - 1
      refreshColumns currentPage + 1
    return

  react _columnNameSearchTerm, throttle refreshColumns, 500

  renderFrame _frame

  defer _go

  key: _frame.frame_id.name
  data: _data
  columnNameSearchTerm: _columnNameSearchTerm
  canGoToPreviousPage: _canGoToPreviousPage
  canGoToNextPage: _canGoToNextPage
  goToPreviousPage: goToPreviousPage
  goToNextPage: goToNextPage
  template: 'flow-frame-data-output'
