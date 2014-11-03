
#
# Insane hack to compress large 2D data tables.
# The basis for using this is described here:
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
createCompiledPrototype = (attrs) ->
  params = ( "a#{i}" for i in [0 ... attrs.length] )
  inits = ( "this[#{JSON.stringify attr}]=a#{i};" for attr, i in attrs )

  prototypeName = nextPrototypeName()
  (new Function "function #{prototypeName}(#{params.join ','}){#{inits.join ''}} return #{prototypeName};")()

createTable = (name, label, description, columns, rows) ->
  schema = {}
  schema[column.name] = column for column in columns

  name: name
  label: label
  description: description
  schema: schema
  columns: columns
  rows: rows

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
