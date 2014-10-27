Flow.Prelude = do ->
  _isDefined = (value) -> not isUndefined value
  _isTruthy = (value) -> if value then yes else no
  _isFalsy = (value) -> if value then no else yes
  _negative = (value) -> not value
  _always = -> yes
  _never = -> no
  _copy = (array) -> array.slice 0
  _remove = (array, element) ->
    if -1 < index = indexOf array, element
      head splice arra, index, 1
    else
      undefined
  _words = (text) -> split text, /\s+/
  _repeat = (count, value) ->
    array = []
    for i in [0 ... count]
      array.push value
    array

  _typeOf = (a) ->
    type = Object::toString.call a
    if a is null
      return 'null'
    else if a is undefined
      return 'undefined'
    else if a is true or a is false or type is '[object Boolean]'
      return 'Boolean'
    else
      switch type
        when '[object String]'
          return 'String'
        when '[object Number]'
          return 'Number'
        when '[object Function]'
          return 'Function'
        when '[object Object]'
          return 'Object'
        when '[object Array]'
          return 'Array'
        when '[object Arguments]'
          return 'Arguments'
        when '[object Date]'
          return 'Date'
        when '[object RegExp]'
          return 'RegExp'
        when '[object Error]'
          return 'Error'
        else
          return type

  _deepClone = (obj) ->
    JSON.parse JSON.stringify obj
  
  isDefined: _isDefined
  isTruthy: _isTruthy
  isFalsy: _isFalsy
  negative: _negative
  always: _always
  never: _never
  copy: _copy
  remove: _remove
  words: _words
  repeat: _repeat
  typeOf: _typeOf
  deepClone: _deepClone
  stringify: JSON.stringify

