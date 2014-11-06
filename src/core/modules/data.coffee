
#
# Insane hack to compress large 2D data tables.
# The basis for doing this is described here:
# http://www.html5rocks.com/en/tutorials/speed/v8/
# See Tip #1 "Hidden Classes"
#
# Applies to IE as well:
# http://msdn.microsoft.com/en-us/library/windows/apps/hh781219.aspx#optimize_property_access
#
# http://jsperf.com/big-data-matrix 
# As of 31 Oct 2014, for a 10000 row, 100 column table in Chrome,
#   retained memory sizes:
# raw json: 31,165 KB
# array of objects: 41,840 KB
# array of arrays: 14,960  KB
# array of prototyped instances: 4,160 KB
#
# Usage:
# Foo = Flow.Data.createCompiledPrototype [ 'bar', 'baz', 'qux', ... ]
# foo = new Foo()
#
# ** Initialization order is important **
# foo.bar = ...
# foo.baz = ...
# foo.qux = ...
# 
#

_prototypeId = 0
nextPrototypeName = -> "Map#{++_prototypeId}"
_prototypeCache = {}
createCompiledPrototype = (attrs) ->
  # Since the prototype depends only on attribute names,
  #  return a cached prototype, if any.
  cacheKey = join attrs, '\0'
  return proto if proto = _prototypeCache[cacheKey]

  params = ( "a#{i}" for i in [0 ... attrs.length] )
  inits = ( "this[#{JSON.stringify attr}]=a#{i};" for attr, i in attrs )

  prototypeName = nextPrototypeName()
  _prototypeCache[cacheKey] = (new Function "function #{prototypeName}(#{params.join ','}){#{inits.join ''}} return #{prototypeName};")()

createTable = (opts) ->
  { name, label, description, columns, rows, meta } = opts
  label = name unless label
  description = 'No description available.' unless description

  schema = {}
  schema[column.name] = column for column in columns

  fill = (i, go) ->
    _fill i, (error, result) ->
      if error
        go error
      else
        { index: startIndex, values } = result
        for value, index in values
          rows[ startIndex + index ] = values[ index ]
        go null
    return
  
  expand = (types...) ->
    for type in types
      name = uniqueId '__flow_column_'
      schema[name] =
        name: name
        label: name
        type: type

  name: name
  label: label
  description: description
  schema: schema
  columns: columns
  rows: rows
  meta: meta
  fill: fill
  expand: expand
  _is_table_: yes

includeZeroInRange = (range) ->
  [ lo, hi ] = range
  if lo > 0 and hi > 0
    [ 0, hi ]
  else if lo < 0 and hi < 0
    [ lo, 0 ]
  else
    range

combineRanges = (ranges...) ->
  lo = Number.POSITIVE_INFINITY
  hi = Number.NEGATIVE_INFINITY
  for range in ranges
    if lo > value = range[0]
      lo = value
    if hi < value = range[1]
      hi = value
  [ lo, hi ]

computeRange = (rows, attr) ->
  if rows.length
    lo = Number.POSITIVE_INFINITY
    hi = Number.NEGATIVE_INFINITY
    for row in rows
      value = row[attr]
      lo = value if value < lo
      hi = value if value > hi
    [ lo , hi ]
  else
    [ -1, 1 ]

permute = (array, indices) ->
  permuted = new Array array.length
  for index, i in indices
    permuted[i] = array[index]
  permuted

factor = (array) ->
  _id = 0
  dict = {}
  domain = []
  data = new Array array.length
  for element, i in array
    unless undefined isnt id = dict[element]
      dict[element] = id = _id++
      domain.push element
    data[i] = id
  [ domain, data ]

Flow.Data =
  StringEnum: 'Enum<String>'
  String: 'String'
  Integer: 'Integer'
  Real: 'Real'
  Date: 'Date'
  Array: 'Array'
  StringArray: 'Array<String>'
  IntegerArray: 'Array<Integer>'
  RealArray: 'Array<Real>'
  DateArray: 'Array<Date>'
  Table: createTable
  isContinuous: (type) -> type is Flow.Data.Integer or type is Flow.Data.Real
  isDiscrete: (type) -> type is Flow.Data.StringEnum or type is Flow.Data.String
  isTemporal: (type) -> type is Flow.Data.Date
  computeColumnInterpretation: (type) ->
    if Flow.Data.isContinuous type
      'c'
    else if Flow.Data.isDiscrete type
      'd'
    else 
      't'
  createCompiledPrototype: createCompiledPrototype
  computeRange: computeRange
  combineRanges: combineRanges
  includeZeroInRange: includeZeroInRange
  factor: factor
  permute: permute
