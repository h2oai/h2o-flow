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

{ stringify } = require('../../core/modules/prelude')
{ TNumber, TFactor } = require('../../core/modules/types')
{ uniqueId, identity } = require('lodash')

_prototypeId = 0
nextPrototypeName = -> "Map#{++_prototypeId}"
_prototypeCache = {}
createCompiledPrototype = (attrs) ->
  # Since the prototype depends only on attribute names,
  #  return a cached prototype, if any.
  cacheKey = attrs.join '\0'
  return proto if proto = _prototypeCache[cacheKey]

  params = ( "a#{i}" for i in [0 ... attrs.length] )
  inits = ( "this[#{stringify attr}]=a#{i};" for attr, i in attrs )

  prototypeName = nextPrototypeName()
  _prototypeCache[cacheKey] = (new Function "function #{prototypeName}(#{params.join ','}){#{inits.join ''}} return #{prototypeName};")()

createRecordConstructor = (variables) ->
  createCompiledPrototype (variable.label for variable in variables)

createTable = (opts) ->
  { label, description, variables, rows, meta } = opts
  description = 'No description available.' unless description

  schema = {}
  schema[variable.label] = variable for variable in variables

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
      #TODO attach to prototype
      label = uniqueId '__flow_variable_'
      schema[label] = createNumericVariable label

  label: label
  description: description
  schema: schema
  variables: variables
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

createAbstractVariable = (_label, _type, _domain, _format, _read) ->
  label: _label
  type: _type
  domain: _domain or []
  format: _format or identity
  read: _read

createNumericVariable = (_label, _domain, _format, _read) ->
  self = createAbstractVariable _label, TNumber, _domain or [ Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY], _format, _read
  unless self.read
    self.read = (datum) ->
      self.domain[0] = datum if datum < self.domain[0]
      self.domain[1] = datum if datum > self.domain[1]
      datum
  self

createVariable = (_label, _type, _domain, _format, _read) ->
  if _type is TNumber
    createNumericVariable _label, _domain, _format, _read
  else
    createAbstractVariable _label, _type, _domain, _format, _read

createFactor = (_label, _domain, _format, _read) ->
  self = createAbstractVariable _label, TFactor, _domain or [], _format, _read
  _id = 0
  _levels = {}
  if self.domain.length
    for level in self.domain
      _levels[level] = _id++

  unless self.read
    self.read = (datum) ->
      level = if datum is undefined or datum is null then 'null' else datum
      unless undefined isnt id = _levels[level]
        _levels[level] = id = _id++
        self.domain.push level
      id

  self

factor = (array) ->
  _id = 0
  levels = {}
  domain = []
  data = new Array array.length
  for level, i in array
    unless undefined isnt id = levels[level]
      levels[level] = id = _id++
      domain.push level
    data[i] = id
  [ domain, data ]

module.exports =
  Table: createTable
  Variable: createVariable
  Factor: createFactor
  computeColumnInterpretation: (type) ->
    if type is TNumber
      'c'
    else if type is TFactor
      'd'
    else 
      't'
  Record: createRecordConstructor
  computeRange: computeRange
  combineRanges: combineRanges
  includeZeroInRange: includeZeroInRange
  factor: factor
  permute: permute
