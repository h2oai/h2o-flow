
#
# Insane hack to compress large 2D data tables.
#
# http://jsperf.com/big-data-matrix 
# As of 31 Oct 2014, for a 10000 row, 100 column table in Chrome,
#   retained memory sizes:
# raw json: 31,165 KB
# array of objects: 41,840 KB
# array of arrays: 14,960  KB
# array of prototyped instances: 4,160 KB

_prototypeId = 0
nextPrototypeName = -> "Dyna#{++_prototypeId}"
createCompiledPrototype = (attrs) ->
  params = ( "a#{i}" for attr, i in attrs )
  inits = ( "this[#{JSON.stringify attr}]=a#{i};" for attr, i in attrs )

  prototypeName = nextPrototypeName()
  (new Function "function #{prototypeName}(#{params.join ','}){#{inits.join ''}} return #{prototypeName};")()

Flow.Data =
  createCompiledPrototype: createCompiledPrototype
