{ defer, map, times, every, filter, throttle, forEach, find } = require('lodash')

{ stringify } = require('../../core/modules/prelude')
{ act, react, lift, link, signal, signals } = require("../../core/modules/dataflow")

MaxItemsPerPage = 15

parseTypes = map [ 'AUTO', 'ARFF', 'XLS', 'XLSX', 'CSV', 'SVMLight', 'ORC', 'AVRO', 'PARQUET' ], (type) -> type: type, caption: type

parseDelimiters = do ->
  whitespaceSeparators = [
    'NULL'
    'SOH (start of heading)'
    'STX (start of text)'
    'ETX (end of text)'
    'EOT (end of transmission)'
    'ENQ (enquiry)'
    'ACK (acknowledge)'
    "BEL '\\a' (bell)"
    "BS  '\\b' (backspace)"
    "HT  '\\t' (horizontal tab)"
    "LF  '\\n' (new line)"
    "VT  '\\v' (vertical tab)"
    "FF  '\\f' (form feed)"
    "CR  '\\r' (carriage ret)"
    'SO  (shift out)'
    'SI  (shift in)'
    'DLE (data link escape)'
    'DC1 (device control 1) '
    'DC2 (device control 2)'
    'DC3 (device control 3)'
    'DC4 (device control 4)'
    'NAK (negative ack.)'
    'SYN (synchronous idle)'
    'ETB (end of trans. blk)'
    'CAN (cancel)'
    'EM  (end of medium)'
    'SUB (substitute)'
    'ESC (escape)'
    'FS  (file separator)'
    'GS  (group separator)'
    'RS  (record separator)'
    'US  (unit separator)'
    "' ' SPACE"
  ]

  CHAR_CODE_PAD = '000'
  createDelimiter = (caption, charCode) ->
    charCode: charCode
    caption: "#{caption}: '#{(CHAR_CODE_PAD + charCode).slice(-CHAR_CODE_PAD.length)}'"

  whitespaceDelimiters = map whitespaceSeparators, createDelimiter

  characterDelimiters = times (126 - whitespaceSeparators.length), (i) ->
    charCode = i + whitespaceSeparators.length
    createDelimiter (String.fromCharCode charCode), charCode

  otherDelimiters = [ charCode: -1, caption: 'AUTO' ]

  whitespaceDelimiters.concat characterDelimiters, otherDelimiters

dataTypes = [
  'Unknown'
  'Numeric'
  'Enum'
  'Time'
  'UUID'
  'String'
  'Invalid'
]

module.exports = (_, _go, _inputs, _result) ->
  _inputKey = if _inputs.paths then 'paths' else 'source_frames'
  _sourceKeys = map _result.source_frames, (src) -> src.name
  _parseType =  signal find parseTypes, (parseType) -> parseType.type is _result.parse_type
  _canReconfigure = lift _parseType, (parseType) -> parseType.type isnt 'SVMLight'
  _delimiter = signal find parseDelimiters, (delimiter) -> delimiter.charCode is _result.separator
  _useSingleQuotes = signal _result.single_quotes
  _destinationKey = signal _result.destination_frame
  _headerOptions = auto: 0, header: 1, data: -1
  _headerOption = signal if _result.check_header is 0 then 'auto' else if _result.check_header is -1 then 'data' else 'header'
  _deleteOnDone = signal yes
  _columnNameSearchTerm = signal ''

  _preview = signal _result
  _chunkSize = lift _preview, (preview) -> preview.chunk_size
  refreshPreview = ->
    columnTypes = (column.type() for column in _columns())
    _.requestParseSetupPreview _sourceKeys, _parseType().type, _delimiter().charCode, _useSingleQuotes(), _headerOptions[_headerOption()], columnTypes, (error, result) ->
      unless error
        _preview result

  _columns = lift _preview, (preview) ->
    columnTypes = preview.column_types
    columnCount = columnTypes.length
    previewData = preview.data
    rowCount = previewData.length
    columnNames = preview.column_names

    rows = new Array columnCount
    for j in [0 ... columnCount]
      data = new Array rowCount
      for i in [0 ... rowCount]
        data[i] = previewData[i][j]

      rows[j] = row =
        index: "#{j + 1}"
        name: signal if columnNames then columnNames[j] else ''
        type: signal columnTypes[j]
        data: data
    rows

  _columnCount = lift _columns, (columns) -> columns?.length or 0

  _currentPage = 0

  act _columns, (columns) ->
    forEach columns, (column) ->
      react column.type, ->
        _currentPage = _activePage().index
        refreshPreview()

  react _parseType, _delimiter, _useSingleQuotes, _headerOption, ->
    _currentPage = 0
    refreshPreview()

  _filteredColumns = lift _columns, (columns) -> columns

  makePage = (index, columns) -> { index, columns }

  _activePage = lift _columns, (columns) -> makePage _currentPage, columns

  filterColumns = ->
    _activePage makePage 0, filter _columns(), (column) -> -1 < column.name().toLowerCase().indexOf _columnNameSearchTerm().toLowerCase()

  react _columnNameSearchTerm, throttle filterColumns, 500

  _visibleColumns = lift _activePage, (currentPage) ->
    start = currentPage.index * MaxItemsPerPage
    currentPage.columns.slice start, start + MaxItemsPerPage

  parseFiles = ->
    columnNames = (column.name() for column in _columns())
    headerOption = _headerOptions[_headerOption()]
    if (every columnNames, (columnName) -> columnName.trim() is '')
      columnNames = null
      headerOption = -1
    columnTypes = (column.type() for column in _columns())

    _.insertAndExecuteCell 'cs', "parseFiles\n  #{_inputKey}: #{stringify _inputs[_inputKey]}\n  destination_frame: #{stringify _destinationKey()}\n  parse_type: #{stringify _parseType().type}\n  separator: #{_delimiter().charCode}\n  number_columns: #{_columnCount()}\n  single_quotes: #{_useSingleQuotes()}\n  #{if _canReconfigure() then 'column_names: ' + (stringify columnNames) + '\n  ' else ''}#{if _canReconfigure() then 'column_types: ' + (stringify columnTypes) + '\n  ' else ''}delete_on_done: #{_deleteOnDone()}\n  check_header: #{headerOption}\n  chunk_size: #{_chunkSize()}"

  _canGoToNextPage = lift _activePage, (currentPage) ->
    (currentPage.index + 1) * MaxItemsPerPage < currentPage.columns.length

  _canGoToPreviousPage = lift _activePage, (currentPage) ->
    currentPage.index > 0

  goToNextPage = ->
    currentPage = _activePage()
    _activePage makePage currentPage.index + 1, currentPage.columns

  goToPreviousPage = ->
    currentPage = _activePage()
    if currentPage.index > 0
      _activePage makePage currentPage.index - 1, currentPage.columns

  defer _go

  sourceKeys: _inputs[_inputKey]
  canReconfigure: _canReconfigure
  parseTypes: parseTypes
  dataTypes: dataTypes
  delimiters: parseDelimiters
  parseType: _parseType
  delimiter: _delimiter
  useSingleQuotes: _useSingleQuotes
  destinationKey: _destinationKey
  headerOption: _headerOption
  deleteOnDone: _deleteOnDone
  columns: _visibleColumns
  parseFiles: parseFiles
  columnNameSearchTerm: _columnNameSearchTerm
  canGoToNextPage: _canGoToNextPage
  canGoToPreviousPage: _canGoToPreviousPage
  goToNextPage: goToNextPage
  goToPreviousPage: goToPreviousPage
  template: 'flow-parse-raw-input'


