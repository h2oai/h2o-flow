parseTypes = map [ 'AUTO', 'ARFF', 'XLS', 'XLSX', 'CSV', 'SVMLight' ], (type) -> type: type, caption: type

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

  createDelimiter = (caption, charCode) ->
    charCode: charCode
    caption: "#{caption}: '#{('00' + charCode).slice(-2)}'"

  whitespaceDelimiters = map whitespaceSeparators, createDelimiter

  characterDelimiters = times (126 - whitespaceSeparators.length), (i) ->
    charCode = i + whitespaceSeparators.length
    createDelimiter (String.fromCharCode charCode), charCode

  otherDelimiters = [ charCode: -1, caption: 'AUTO' ]

  concat whitespaceDelimiters, characterDelimiters, otherDelimiters

dataTypes = [
  'Unknown'
  'Numeric'
  'Enum'
  'Time'
  'UUID'
  'String'
  'Invalid'
]

H2O.SetupParseOutput = (_, _go, _inputs, _result) ->
  _inputKey = if _inputs.paths then 'paths' else 'source_keys'
  _sourceKeys = map _result.source_keys, (src) -> src.name
  _parseType =  signal find parseTypes, (parseType) -> parseType.type is _result.parse_type
  _delimiter = signal find parseDelimiters, (delimiter) -> delimiter.charCode is _result.separator 
  _useSingleQuotes = signal _result.single_quotes
  _destinationKey = signal _result.destination_key
  _headerOptions = auto: 0, header: 1, data: -1
  _headerOption = signal if _result.check_header is 0 then 'auto' else if _result.check_header is -1 then 'data' else 'header'
  _deleteOnDone = signal yes

  _preview = signal _result
  _columnCount = lift _preview, (preview) -> preview.number_columns
  _hasColumns = lift _columnCount, (count) -> count > 0
  _hasColumnNames = lift _preview, (preview) -> if preview.column_names then yes else no

  _columns = lift _preview, (preview) ->
    columnNames = preview.column_names
    columnTypes = preview.column_types
    for i in [0 ... preview.number_columns]
      name: signal if columnNames then columnNames[i] else ''
      type: signal columnTypes[i]

  _rows = lift _preview, (preview) -> preview.data
  _chunkSize = lift _preview, (preview) -> preview.chunk_size

  react _parseType, _delimiter, _useSingleQuotes, _headerOption, (parseType, delimiter, useSingleQuotes, headerOption) ->
    _.requestParseSetupPreview _sourceKeys, parseType.type, delimiter.charCode, useSingleQuotes, _headerOptions[headerOption], (error, result) ->
      unless error
        _preview result

  parseFiles = ->
    columnNames = (column.name() for column in _columns())
    columnTypes = (column.type() for column in _columns())

    _.insertAndExecuteCell 'cs', "parseFiles\n  #{_inputKey}: #{stringify _inputs[_inputKey]}\n  destination_key: #{stringify _destinationKey()}\n  parse_type: #{stringify _parseType().type}\n  separator: #{_delimiter().charCode}\n  number_columns: #{_columnCount()}\n  single_quotes: #{_useSingleQuotes()}\n  column_names: #{stringify columnNames}\n  column_types: #{stringify columnTypes}\n  delete_on_done: #{_deleteOnDone()}\n  check_header: #{_headerOptions[_headerOption()]}\n  chunk_size: #{_chunkSize()}"

  defer _go

  sourceKeys: _inputs[_inputKey]
  parseTypes: parseTypes
  dataTypes: dataTypes
  delimiters: parseDelimiters
  parseType: _parseType
  delimiter: _delimiter
  useSingleQuotes: _useSingleQuotes
  columns: _columns
  rows: _rows
  columnCount: _columnCount
  hasColumns: _hasColumns
  destinationKey: _destinationKey
  headerOption: _headerOption
  deleteOnDone: _deleteOnDone
  parseFiles: parseFiles
  template: 'flow-parse-raw-input'


