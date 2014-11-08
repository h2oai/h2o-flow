
#
# Insane hack to compress large 2D data tables.
# The basis for doing this is described here:
# http://www.html5rocks.com/en/tutorials/speed/v8/
# See Tip #1 "Hidden Classes"
#
# Applies to IE as well:
# http://msdn.microsoft.com/en-us/library/windows/apps/hh781219.aspx#optimize_property_access
#
# http://jsperf.com/big-data-matrix/3
# As of 31 Oct 2014, for a 10000 row, 100 column table in Chrome,
#   retained memory sizes:
# raw json: 31,165 KB
# array of objects: 41,840 KB
# array of arrays: 14,960 KB
# array of prototyped instances: 14,840 KB
#
# Usage:
# Foo = Flow.Data.createCompiledPrototype [ 'bar', 'baz', 'qux', ... ]
# foo = new Foo()
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

compile = (columns) ->
  createCompiledPrototype (column.name for column in columns)

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

createFactor = ->
  _id = 0
  _dict = {}
  _domain = []
  self = (element) ->
    value = if element is undefined or element is null then 'null' else element
    unless undefined isnt id = _dict[value]
      _dict[value] = id = _id++
      _domain.push value
    id
  self.domain = _domain
  self

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
  Enum: 'Enum'
  Object: 'Object'
  String: 'String'
  Integer: 'Integer'
  Real: 'Real'
  Date: 'Date'
  Array: 'Array'
  Boolean: 'Boolean'
  Table: createTable
  computeColumnInterpretation: (type) ->
    #XXX switch to Flow.Data.Integer
    if type is Flow.Data.Real or type is Flow.Data.Integer
      'c'
    else if type is Flow.Data.Enum
      'd'
    else 
      't'
  createCompiledPrototype: createCompiledPrototype
  compile: compile
  computeRange: computeRange
  combineRanges: combineRanges
  includeZeroInRange: includeZeroInRange
  factor: factor
  Factor: createFactor
  permute: permute
