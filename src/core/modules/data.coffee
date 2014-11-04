
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

createTable = (name, label, description, columns, rows, _fill) ->
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

  name: name
  label: label
  description: description
  schema: schema
  columns: columns
  rows: rows
  fill: fill

Flow.Data =
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
  createCompiledPrototype: createCompiledPrototype
