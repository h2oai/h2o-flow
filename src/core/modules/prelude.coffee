Flow.Prelude =
  isDefined: (value) -> not isUndefined value
  isTruthy: (value) -> if value then yes else no
  isFalsy: (value) -> if value then no else yes
  negative: (value) -> not value
  always: -> yes
  never: -> no
  copy: (array) -> array.slice 0
  remove: (array, element) ->
    if -1 < index = array.indexOf element
      head array.splice index, 1
    else
      undefined
  words: (text) -> split text, /\s+/
  repeat: (count, value) ->
    array = []
    for i in [0 ... count]
      array.push value
    array
