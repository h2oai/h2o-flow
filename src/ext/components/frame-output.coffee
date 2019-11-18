{ defer, throttle } = require('lodash')

{ stringify } = require('../../core/modules/prelude')
{ react, lift, link, signal, signals } = require("../../core/modules/dataflow")
util = require('../../core/modules/util')

module.exports = (_, _go, _frame) ->
  MaxItemsPerPage = 20

  _grid = signal null
  _chunkSummary = signal null
  _distributionSummary = signal null
  _columnNameSearchTerm = signal null
  _currentPage = signal 0
  _maxPages = signal Math.ceil _frame.total_column_count / MaxItemsPerPage
  _canGoToPreviousPage = lift _currentPage, (index) -> index > 0
  _canGoToNextPage = lift _maxPages, _currentPage, (maxPages, index) -> index < maxPages - 1

  renderPlot = (container, render) ->
    render (error, vis) ->
      if error
        console.debug error
      else
        container vis.element

  renderGrid = (render) ->
    render (error, vis) ->
      if error
        console.debug error
      else
        $('a', vis.element).on 'click', (e) ->
          $a = $ e.target
          switch $a.attr 'data-type'
            when 'summary-link'
              _.insertAndExecuteCell 'cs', "getColumnSummary #{stringify _frame.frame_id.name}, #{stringify $a.attr 'data-key'}"
            when 'as-factor-link'
              _.insertAndExecuteCell 'cs', "changeColumnType frame: #{stringify _frame.frame_id.name}, column: #{stringify $a.attr 'data-key'}, type: 'enum'"
            when 'as-numeric-link'
              _.insertAndExecuteCell 'cs', "changeColumnType frame: #{stringify _frame.frame_id.name}, column: #{stringify $a.attr 'data-key'}, type: 'int'"

        _grid vis.element

  createModel = ->
    _.insertAndExecuteCell 'cs', "assist buildModel, null, training_frame: #{stringify _frame.frame_id.name}"

  createAutoML = ->
    _.insertAndExecuteCell 'cs', "assist runAutoML, training_frame: #{stringify _frame.frame_id.name}"

  inspect = ->
    _.insertAndExecuteCell 'cs', "inspect getFrameSummary #{stringify _frame.frame_id.name}"

  inspectData = ->
    _.insertAndExecuteCell 'cs', "getFrameData #{stringify _frame.frame_id.name}"

  splitFrame = ->
    _.insertAndExecuteCell 'cs', "assist splitFrame, #{stringify _frame.frame_id.name}"

  predict = ->
    _.insertAndExecuteCell 'cs', "predict frame: #{stringify _frame.frame_id.name}"

  download = ->
    window.open _.ContextPath + "3/DownloadDataset?frame_id=#{encodeURIComponent _frame.frame_id.name}", '_blank'

  exportFrame = ->
    _.insertAndExecuteCell 'cs', "exportFrame #{stringify _frame.frame_id.name}"

  deleteFrame = ->
    _.confirm 'Are you sure you want to delete this frame?', { acceptCaption: 'Delete Frame', declineCaption: 'Cancel' }, (accept) ->
      if accept
        _.insertAndExecuteCell 'cs', "deleteFrame #{stringify _frame.frame_id.name}"

  renderFrame = (frame) ->
    renderGrid _.plot (g) ->
      g(
        g.select()
        g.from _.inspect 'columns', frame
      )

    renderPlot _chunkSummary, _.plot (g) ->
      g(
        g.select()
        g.from _.inspect 'Chunk compression summary', frame
      )

    renderPlot _distributionSummary, _.plot (g) ->
      g(
        g.select()
        g.from _.inspect 'Frame distribution summary', frame
      )

  _lastUsedSearchTerm = null 
  refreshColumns = (pageIndex) ->
    searchTerm = _columnNameSearchTerm()
    if searchTerm isnt _lastUsedSearchTerm
      pageIndex = 0
       
    startIndex = pageIndex * MaxItemsPerPage
    itemCount = if startIndex + MaxItemsPerPage < _frame.total_column_count then MaxItemsPerPage else _frame.total_column_count - startIndex
    _.requestFrameSummarySliceE _frame.frame_id.name, searchTerm, startIndex, itemCount, (error, frame) ->
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
  rowCount: _frame.rows
  columnCount: _frame.total_column_count
  size: util.formatBytes _frame.byte_size
  chunkSummary: _chunkSummary
  distributionSummary: _distributionSummary
  columnNameSearchTerm: _columnNameSearchTerm
  grid: _grid
  inspect: inspect
  createModel: createModel
  createAutoML: createAutoML
  inspectData: inspectData
  splitFrame: splitFrame
  predict: predict
  download: download
  exportFrame: exportFrame
  canGoToPreviousPage: _canGoToPreviousPage
  canGoToNextPage: _canGoToNextPage
  goToPreviousPage: goToPreviousPage
  goToNextPage: goToNextPage
  deleteFrame: deleteFrame
  template: 'flow-frame-output'

