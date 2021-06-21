{ defer, map, filter, throttle } = require('lodash')

{ stringify } = require('../../core/modules/prelude')
{ react, lift, link, signal, signals } = require("../../core/modules/dataflow")
util = require('../../core/modules/util')
FlowError = require('../../core/modules/flow-error')

module.exports = (_, _go) ->
  _exception = signal null 
  _destinationKey = signal "pdp-#{util.uuid()}"

  _frames = signals []
  _models = signals []
  _selectedModel = signals null
  _selectedFrame = signal null
  _useCustomColumns = signal no
  _columns = signal []
  _columnValues = signal []
  _columns2d = signal []
  _nbins = signal 20
  _row_index = signal -1
  _useCustomTargets = signal no
  _targets = signal []

  MaxItemsPerPage = 100

  changeSelection = (source, value) ->
    for entry in source
      entry.isSelected value
    return

  # search & filter columns
  _visibleColumns = signal []
  _filteredColumns = signal []
  _currentColumnsPage = signal 0
  _maxColumnsPages = lift _filteredColumns, (entries) -> Math.ceil entries.length / MaxItemsPerPage
  _canGoToPreviousColumnsPage = lift _currentColumnsPage, (index) -> index > 0
  _canGoToNextColumnsPage = lift _maxColumnsPages, _currentColumnsPage, (maxColumnsPages, index) -> index < maxColumnsPages - 1

  _columnsSelectionCount = signal 0
  _isUpdatingColumnsSelectionCount = no

  _searchTermColumns = signal ''
  _searchColumnsCaption = lift _columns, _filteredColumns, _columnsSelectionCount, _currentColumnsPage, _maxColumnsPages, (entries, filteredColumns, columnsSelectionCount, currentColumnsPage, maxColumnsPages) ->
    caption = if maxColumnsPages is 0 then '' else "Showing page #{currentColumnsPage + 1} of #{maxColumnsPages}."
    if filteredColumns.length isnt entries.length
      caption += " Filtered #{filteredColumns.length} of #{entries.length}."
    if columnsSelectionCount isnt 0
      caption += " #{columnsSelectionCount} selected for PDP calculations."
    caption

  blockColumnsSelectionUpdates = (f) ->
    _isUpdatingColumnsSelectionCount = yes
    f()
    _isUpdatingColumnsSelectionCount = no

  incrementColumnsSelectionCount = (amount) ->
    _columnsSelectionCount _columnsSelectionCount() + amount

  _hasFilteredColumns = lift _columns, (entries) -> entries.length > 0

  filterColumns = ->
    searchTermColumns = _searchTermColumns().trim()

    filteredColumns = []

    for entry, i in _columns()
      hide = no
      if (searchTermColumns isnt '') and -1 is entry.value.toLowerCase().indexOf searchTermColumns.toLowerCase()
        hide = yes

      unless hide
        filteredColumns.push entry

    _filteredColumns filteredColumns

    start = _currentColumnsPage() * MaxItemsPerPage
    _visibleColumns _filteredColumns().slice start, start + MaxItemsPerPage

  # when searchTermColumns changes, filterColumns is called
  react _searchTermColumns, throttle filterColumns, 500

  _selectFilteredColumns = ->
    entries = _filteredColumns()
    blockColumnsSelectionUpdates -> changeSelection entries, yes
    _columnsSelectionCount entries.length

  _deselectFilteredColumns = ->
    blockColumnsSelectionUpdates -> changeSelection _columns(), no
    _columnsSelectionCount 0

  _goToPreviousColumnsPage = ->
    if _canGoToPreviousColumnsPage()
      _currentColumnsPage _currentColumnsPage() - 1
      filterColumns()
    return

  _goToNextColumnsPage = ->
    if _canGoToNextColumnsPage()
      _currentColumnsPage _currentColumnsPage() + 1
      filterColumns()
    return

  _selectedColsToString = ->
    cols = ""
    for col in _columns() when col.isSelected()
      cols = cols + "\"" + col.value + "\","
    if cols != ""
      cols ="[" + cols + "]"
    cols
  # end of search & filter columns

  # search & filter targets
  _visibleTargets = signal []
  _filteredTargets = signal []
  _currentTargetsPage = signal 0
  _maxTargetsPages = lift _filteredTargets, (entries) -> Math.ceil entries.length / MaxItemsPerPage
  _canGoToPreviousTargetsPage = lift _currentTargetsPage, (index) -> index > 0
  _canGoToNextTargetsPage = lift _maxTargetsPages, _currentTargetsPage, (maxTargetsPages, index) -> index < maxTargetsPages - 1

  _targetsSelectionCount = signal 0
  _isUpdatingTargetsSelectionCount = no

  _searchTermTargets = signal ''
  _searchTargetsCaption = lift _targets, _filteredTargets, _targetsSelectionCount, _currentTargetsPage, _maxTargetsPages, (entries, filteredTargets, targetsSelectionCount, currentTargetsPage, maxTargetsPages) ->
    caption = if maxTargetsPages is 0 then '' else "Showing page #{currentTargetsPage + 1} of #{maxTargetsPages}."
    if filteredTargets.length isnt entries.length
      caption += " Filtered #{filteredTargets.length} of #{entries.length}."
    if targetsSelectionCount isnt 0
      caption += " #{targetsSelectionCount} selected for PDP calculations."
    caption


  blockTargetsSelectionUpdates = (f) ->
    _isUpdatingTargetsSelectionCount = yes
    f()
    _isUpdatingTargetsSelectionCount = no

  incrementTargetsSelectionCount = (amount) ->
    _targetsSelectionCount _targetsSelectionCount() + amount

  _hasFilteredTargets = lift _targets, (entries) -> entries.length > 0

  filterTargets = ->
    searchTermTargets = _searchTermTargets().trim()

    filteredTargets = []

    for entry, i in _targets()
      hide = no
      if (searchTermTargets isnt '') and -1 is entry.value.toLowerCase().indexOf searchTermTargets.toLowerCase()
        hide = yes

      unless hide
        filteredTargets.push entry

    _filteredTargets filteredTargets

    start = _currentTargetsPage() * MaxItemsPerPage
    _visibleTargets _filteredTargets().slice start, start + MaxItemsPerPage

  # when searchTermTargets changes, filterTargets is called
  react _searchTermTargets, throttle filterTargets, 500

  _selectFilteredTargets = ->
    entries = _filteredTargets()
    blockTargetsSelectionUpdates -> changeSelection entries, yes
    _targetsSelectionCount entries.length

  _deselectFilteredTargets = ->
    blockTargetsSelectionUpdates -> changeSelection _targets(), no
    _targetsSelectionCount 0

  _goToPreviousTargetsPage = ->
    if _canGoToPreviousTargetsPage()
      _currentTargetsPage _currentTargetsPage() - 1
      filterTargets()
    return

  _goToNextTargetsPage = ->
    if _canGoToNextTargetsPage()
      _currentTargetsPage _currentTargetsPage() + 1
      filterTargets()
    return

  _selectedTargetsToString = ->
    res = ""
    targets = _targets()
    if targets != null
      for t in targets when t.isSelected()
        res = res + "\"" + t.value + "\","
      if res != ""
        res ="[" + res + "]"
    res
  # end of search & filter targets

  _addColumns2d = ->
    vals = _columns2d()
    entry = {
      firstColumn: _columnValues()[0]
      secondColumn: _columnValues()[0]
      columnValues: _columnValues
    }
    _removeSelf = ->
      _columns2d _columns2d().filter (it) -> it != entry
    entry.removeSelf = _removeSelf
    vals.push entry
    _columns2d vals

  _cols2dToString = ->
    cols = ""
    for col in _columns2d()
      cols = cols + "[\"" + col.firstColumn + "\",\"" + col.secondColumn + "\"], "
    if cols != ""
      cols ="[" + cols + "]"
    cols

  # a conditional check that makes sure that
  # all fields in the form are filled in
  # before the button is shown as active
  _canCompute = lift _destinationKey, _selectedFrame, _selectedModel, _nbins, _row_index, _targets, (dk, sf, sm, nb, ri) ->
    dk and sf and sm and nb and ri

  _compute = ->
    return unless _canCompute()

    opts =
      destination_key: _destinationKey()
      model_id: _selectedModel()
      frame_id: _selectedFrame()
      cols: _selectedColsToString()
      targets: _selectedTargetsToString()
      col_pairs_2dpdp: _cols2dToString()
      nbins: _nbins()
      row_index: _row_index()

    # assemble a string for the h2o Rapids AST
    # this contains the function to call
    # along with the options to pass in
    cs = "buildPartialDependence #{stringify opts}"

    # insert a cell with the expression `cs`
    # into the current Flow notebook
    # and run the cell
    _.insertAndExecuteCell 'cs', cs

  _updateColumns = ->
      frameKey = _selectedFrame()
      if frameKey
        _.requestFrameSummaryWithoutData frameKey, (error, frame) ->
          unless error
            columnValues = map frame.columns, (column) -> column.label
            columnLabels = map frame.columns, (column) ->
              missingPercent = 100 * column.missing_count / frame.rows
              isSelected = signal no
              react isSelected, (isSelected) ->
                unless _isUpdatingColumnsSelectionCount
                  if isSelected
                    incrementColumnsSelectionCount 1
                  else
                    incrementColumnsSelectionCount -1
                return

              isSelected: isSelected
              type: if column.type is 'enum' then "enum(#{column.domain_cardinality})" else column.type
              value: column.label
              missingPercent: missingPercent
              missingLabel: if missingPercent is 0 then '' else "#{Math.round missingPercent}% NA"

            _columns columnLabels
            _columnValues columnValues

            #reset filtered views
            _currentColumnsPage 0
            _searchTermColumns ''
            filterColumns()
      else
        _columns2d []

  _updateTargets = ->
    modelKey = _selectedModel()
    if modelKey
      _.requestModel modelKey, (error, model) ->
        unless error
          responseDomain = model.output.domains[model.output.domains.length-1]
          _useCustomTargets responseDomain != null && responseDomain.length > 2
          if _useCustomTargets()
            targetValues = map responseDomain, (value) ->
              isSelected = signal no
              react isSelected, (isSelected) ->
                unless _isUpdatingTargetsSelectionCount
                  if isSelected
                    incrementTargetsSelectionCount 1
                  else
                    incrementTargetsSelectionCount -1
                return

              isSelected: isSelected
              value: value

            _targets targetValues

            #reset filtered views
            _currentTargetsPage 0
            _searchTermTargets ''
            filterTargets()
          else
            _targets null

  _.requestFrames (error, frames) ->
    if error
      _exception new FlowError 'Error fetching frame list.', error
    else
      _frames (frame.frame_id.name for frame in frames when not frame.is_text)

  _.requestModels (error, models) ->
    if error
      _exception new FlowError 'Error fetching model list.', error
    else
      _models (model.model_id.name for model in models)


  defer _go

  exception:_exception
  destinationKey: _destinationKey
  frames: _frames
  models: _models
  selectedModel: _selectedModel
  selectedFrame: _selectedFrame
  columns: _columns
  visibleColumns: _visibleColumns
  useCustomColumns: _useCustomColumns
  targets: _targets
  useCustomTargets: _useCustomTargets
  visibleTargets: _visibleTargets
  columnValues: _columnValues
  colums2d: _columns2d
  nbins: _nbins
  row_index: _row_index
  compute: _compute
  updateColumns: _updateColumns
  updateTargets: _updateTargets
  canCompute: _canCompute

  # add&remove functionality of columns2d
  addColumns2d: _addColumns2d

  # search & filter functionalities of column selector
  hasFilteredColumns: _hasFilteredColumns
  selectFilteredColumns: _selectFilteredColumns
  deselectFilteredColumns: _deselectFilteredColumns
  goToPreviousColumnsPage: _goToPreviousColumnsPage
  goToNextColumnsPage: _goToNextColumnsPage
  canGoToPreviousColumnsPage: _canGoToPreviousColumnsPage
  canGoToNextColumnsPage: _canGoToNextColumnsPage
  searchTermColumns: _searchTermColumns
  searchColumnsCaption: _searchColumnsCaption

  # search & filter functionalities of targets selector
  hasFilteredTargets: _hasFilteredTargets
  selectFilteredTargets: _selectFilteredTargets
  deselectFilteredTargets: _deselectFilteredTargets
  goToPreviousTargetsPage: _goToPreviousTargetsPage
  goToNextTargetsPage: _goToNextTargetsPage
  canGoToPreviousTargetsPage: _canGoToPreviousTargetsPage
  canGoToNextTargetsPage: _canGoToNextTargetsPage
  searchTermTargets: _searchTermTargets
  searchTargetsCaption: _searchTargetsCaption


  template: 'flow-partial-dependence-input'
