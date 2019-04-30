{ head, isUndefined, indexOf, isNumber, isObject } = require('lodash')
BigNumber = require('bignumber.js');

{ TNull, TUndefined, TBoolean, TString, TNumber, TFunction, TObject, TArray, TArguments, TDate, TRegExp, TError } = require('./types')

module.exports = do ->
  _isDefined = (value) -> not isUndefined value
  _isTruthy = (value) -> if value then yes else no
  _isFalsy = (value) -> if value then no else yes
  _isNumber = (value) -> isNumber(value) || value instanceof BigNumber
  _isObject = (value) -> isObject(value) && !(value instanceof BigNumber)
  _negative = (value) -> not value
  _always = -> yes
  _never = -> no
  _copy = (array) -> array.slice 0
  _remove = (array, element) ->
    if -1 < index = indexOf array, element
      head array.splice index, 1
    else
      undefined
  _words = (text) -> text.split /\s+/
  _repeat = (count, value) ->
    array = []
    for i in [0 ... count]
      array.push value
    array

  _typeOf = (a) ->
    type = Object::toString.call a
    if a is null
      return TNull
    else if a is undefined
      return TUndefined
    else if a is true or a is false or type is '[object Boolean]'
      return TBoolean
    else
      switch type
        when '[object String]'
          return TString
        when '[object Number]'
          return TNumber
        when '[object Function]'
          return TFunction
        when '[object Object]'
          return TObject
        when '[object Array]'
          return TArray
        when '[object Arguments]'
          return TArguments
        when '[object Date]'
          return TDate
        when '[object RegExp]'
          return TRegExp
        when '[object Error]'
          return TError
        else
          return type

  _deepClone = (obj) ->
    JSON.parse JSON.stringify obj
  
  isDefined: _isDefined
  isTruthy: _isTruthy
  isFalsy: _isFalsy
  isNumber: _isNumber
  isObject: _isObject
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

