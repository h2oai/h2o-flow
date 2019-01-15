aesjs = require('aes-js')
{ throttle, map } = require("lodash")

{ react, lift, signal, signals } = require("../../core/modules/dataflow")
util = require('../../core/modules/util')

validateFileExtension = (filename, extension) ->
  -1 isnt filename.indexOf extension, filename.length - extension.length

getFileBaseName = (filename, extension) ->
  util.sanitizeName filename.substr 0, filename.length - extension.length

createListControl = (parameter) ->
  MaxItemsPerPage = 100
  _searchTerm = signal ''
  _ignoreNATerm = signal ''

  _values = signal []

  _selectionCount = signal 0

  _isUpdatingSelectionCount = no
  blockSelectionUpdates = (f) ->
    _isUpdatingSelectionCount = yes
    f()
    _isUpdatingSelectionCount = no

  incrementSelectionCount = (amount) ->
    _selectionCount _selectionCount() + amount

  createEntry = (value) ->
    isSelected = signal no
    react isSelected, (isSelected) ->
      unless _isUpdatingSelectionCount
        if isSelected
          incrementSelectionCount 1
        else
          incrementSelectionCount -1
      return

    isSelected: isSelected
    value: value.value
    type: value.type
    missingLabel: value.missingLabel
    missingPercent: value.missingPercent

  _entries = lift _values, (values) -> map values, createEntry
  _filteredItems = signal []
  _visibleItems = signal []
  _hasFilteredItems = lift _filteredItems, (entries) -> entries.length > 0
  _currentPage = signal 0
  _maxPages = lift _filteredItems, (entries) -> Math.ceil entries.length / MaxItemsPerPage
  _canGoToPreviousPage = lift _currentPage, (index) -> index > 0
  _canGoToNextPage = lift _maxPages, _currentPage, (maxPages, index) -> index < maxPages - 1

  _searchCaption = lift _entries, _filteredItems, _selectionCount, _currentPage, _maxPages, (entries, filteredItems, selectionCount, currentPage, maxPages) ->
    caption = if maxPages is 0 then '' else "Showing page #{currentPage + 1} of #{maxPages}."
    if filteredItems.length isnt entries.length
      caption += " Filtered #{filteredItems.length} of #{entries.length}."
    if selectionCount isnt 0
      caption += " #{selectionCount} ignored."
    caption

  react _entries, -> filterItems yes

  _lastUsedSearchTerm = null
  _lastUsedIgnoreNaTerm = null
  filterItems = (force=no) ->
    searchTerm = _searchTerm().trim()
    ignoreNATerm = _ignoreNATerm().trim()

    if force or searchTerm isnt _lastUsedSearchTerm or ignoreNATerm isnt _lastUsedIgnoreNaTerm
      filteredItems = []
      for entry, i in _entries()
        missingPercent = parseFloat ignoreNATerm
        hide = no
        if (searchTerm isnt '') and -1 is entry.value.toLowerCase().indexOf searchTerm.toLowerCase()
          hide = yes
        else if (not isNaN missingPercent) and (missingPercent isnt 0) and entry.missingPercent <= missingPercent
          hide = yes

        unless hide
          filteredItems.push entry

      _lastUsedSearchTerm = searchTerm
      _lastUsedIgnoreNaTerm = ignoreNATerm
      _currentPage 0
      _filteredItems filteredItems

    start = _currentPage() * MaxItemsPerPage
    _visibleItems _filteredItems().slice start, start + MaxItemsPerPage

    return

  changeSelection = (source, value) ->
    for entry in source
      entry.isSelected value
    return

  selectFiltered = ->
    entries = _filteredItems()
    blockSelectionUpdates -> changeSelection entries, yes
    _selectionCount entries.length

  deselectFiltered = ->
    blockSelectionUpdates -> changeSelection _filteredItems(), no
    _selectionCount 0

  goToPreviousPage = ->
    if _canGoToPreviousPage()
      _currentPage _currentPage() - 1
      filterItems()
    return

  goToNextPage = ->
    if _canGoToNextPage()
      _currentPage _currentPage() + 1
      filterItems()
    return

  react _searchTerm, throttle filterItems, 500
  react _ignoreNATerm, throttle filterItems, 500

  control = createControl 'list', parameter
  control.values = _values
  control.entries = _visibleItems
  control.hasFilteredItems = _hasFilteredItems
  control.searchCaption = _searchCaption
  control.searchTerm = _searchTerm
  control.ignoreNATerm = _ignoreNATerm
  control.value = _entries
  control.selectFiltered = selectFiltered
  control.deselectFiltered = deselectFiltered
  control.goToPreviousPage = goToPreviousPage
  control.goToNextPage = goToNextPage
  control.canGoToPreviousPage = _canGoToPreviousPage
  control.canGoToNextPage = _canGoToNextPage
  control

createControl = (kind, parameter) ->
  _hasError = signal no
  _hasWarning = signal no
  _hasInfo = signal no
  _message = signal ''
  _hasMessage = lift _message, (message) -> if message then yes else no
  _isVisible = signal yes
  _isGrided = signal no
  _isNotGrided = lift _isGrided, (value) -> not value

  kind: kind
  name: parameter.name
  label: parameter.label
  description: parameter.help
  isRequired: parameter.required
  hasError: _hasError
  hasWarning: _hasWarning
  hasInfo: _hasInfo
  message: _message
  hasMessage: _hasMessage
  isVisible: _isVisible
  isGridable: parameter.gridable
  isGrided: _isGrided
  isNotGrided: _isNotGrided

columnLabelsFromFrame = (frame) ->
  columnLabels = map frame.columns, (column) ->
    missingPercent = 100 * column.missing_count / frame.rows

    type: if column.type is 'enum' then "enum(#{column.domain_cardinality})" else column.type
    value: column.label
    missingPercent: missingPercent
    missingLabel: if missingPercent is 0 then '' else "#{Math.round missingPercent}% NA"

  columnLabels

key = [64, 14, 190, 99, 77, 107, 95, 26, 211, 235, 41, 125, 110, 237, 151, 148]
encryptPassword = (password) ->
  aesCtr = new aesjs.ModeOfOperation.ctr key, new aesjs.Counter 5;
  passwordBytes = aesjs.utils.utf8.toBytes password
  encryptedBytes = aesCtr.encrypt passwordBytes
  aesjs.utils.hex.fromBytes encryptedBytes

decryptPassword = (encrypted) ->
  aesCtr = new aesjs.ModeOfOperation.ctr key, new aesjs.Counter 5;
  encryptedBytes = aesjs.utils.hex.toBytes encrypted
  passwordBytes = aesCtr.decrypt encryptedBytes
  aesjs.utils.utf8.fromBytes passwordBytes

module.exports =
  validateFileExtension: validateFileExtension
  getFileBaseName: getFileBaseName
  createListControl: createListControl
  createControl: createControl
  columnLabelsFromFrame: columnLabelsFromFrame
  encryptPassword: encryptPassword
  decryptPassword: decryptPassword