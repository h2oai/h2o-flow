parserTypes = map [ 'AUTO', 'XLS', 'CSV', 'SVMLight' ], (type) -> type: type, caption: type

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

Flow.SetupParseOutput = (_, _result) ->
  _sourceKeys = map _result.srcs, (src) -> src.name
  _parserType =  signal find parserTypes, (parserType) -> parserType.type is _result.pType
  _delimiter = signal find parseDelimiters, (delimiter) -> delimiter.charCode is _result.sep 
  _useSingleQuotes = signal _result.singleQuotes
  _columns = map _result.columnNames, (name) -> name: signal name
  _rows = _result.data
  _columnCount = _result.ncols
  _hasColumns = _columnCount > 0
  _destinationKey = signal _result.hexName
  _headerOptions = auto: 0, header: 1, data: -1
  _headerOption = signal if _result.checkHeader is 0 then 'auto' else if _result.checkHeader is -1 then 'data' else 'header'
  _deleteOnDone = signal yes

  parseFiles = ->
    columnNames = map _columns, (column) -> column.name()

    _.insertAndExecuteCell 'cs', "parseRaw\n  srcs: #{stringify _sourceKeys}\n  hex: #{stringify _destinationKey()}\n  pType: #{stringify _parserType().type}\n  sep: #{_delimiter().charCode}\n  ncols: #{_columnCount}\n  singleQuotes: #{_useSingleQuotes()}\n  columnNames: #{stringify columnNames}\n  delete_on_done: #{_deleteOnDone()}\n  checkHeader: #{_headerOptions[_headerOption()]}"

  sourceKeys: _sourceKeys
  parserTypes: parserTypes
  delimiters: parseDelimiters
  parserType: _parserType
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


