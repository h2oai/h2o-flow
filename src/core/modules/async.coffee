{ isString, isFunction, isArray, forEach } = require('lodash')

{ typeOf } = require('./prelude')
FlowError = require('./flow-error')

createBuffer = (array) ->
  _array = array or []
  _go = null
  buffer = (element) ->
    if element is undefined
      _array
    else
      _array.push element
      _go element if _go
      element
  buffer.subscribe = (go) -> _go = go
  buffer.buffer = _array
  buffer.isBuffer = yes
  buffer

_noop = (go) -> go null

_applicate = (go) -> 
  (error, args) ->
    go.apply null, [ error ].concat args if isFunction go

_fork = (f, args) ->
  throw new FlowError "Not a function." unless isFunction f
  self = (go) ->
    canGo = isFunction go
    if self.settled
      # proceed with cached error/result
      if self.rejected
        go self.error if canGo
      else
        go null, self.result if canGo
    else
      _join args, (error, args) ->
        if error
          self.error = error
          self.fulfilled = no
          self.rejected = yes
          go error if canGo
        else
          f.apply null,
            args.concat (error, result) ->
              if error
                self.error = error
                self.fulfilled = no
                self.rejected = yes
                go error if canGo
              else
                self.result = result
                self.fulfilled = yes
                self.rejected = no
                go null, result if canGo
              self.settled = yes
              self.pending = no

  self.method = f
  self.args = args
  self.fulfilled = no
  self.rejected = no
  self.settled = no
  self.pending = yes

  self.isFuture = yes

  self

_isFuture = (a) -> if a?.isFuture then yes else no

_join = (args, go) ->
  return go null, [] if args.length is 0

  _tasks = [] 
  _results = []

  for arg, i in args
    if arg?.isFuture
      _tasks.push future: arg, resultIndex: i
    else
      _results[i] = arg

  return go null, _results if _tasks.length is 0

  _actual = 0
  _settled = no

  forEach _tasks, (task) ->
    task.future.call null, (error, result) ->
      return if _settled
      if error
        _settled = yes
        go new FlowError "Error evaluating future[#{task.resultIndex}]", error
      else
        _results[task.resultIndex] = result
        _actual++
        if _actual is _tasks.length
          _settled = yes
          go null, _results
      return
  return

# Like _.compose, but async. 
# Equivalent to caolan/async.waterfall()
pipe = (tasks) ->
  _tasks = tasks.slice 0

  next = (args, go) ->
    task = _tasks.shift()
    if task
      task.apply null, args.concat (error, results...) ->
        if error
          go error
        else
          next results, go
    else
      go.apply null, [ null ].concat args

  (args..., go) ->
    next args, go

iterate = (tasks) ->
  _tasks = tasks.slice 0
  _results = []
  next = (go) ->
    task = _tasks.shift()
    if task
      task (error, result) ->
        if error
          return go error
        else
          _results.push result
        next go
    else
      #XXX should errors be included in arg #1?
      go null, _results

  (go) ->
    next go

#
# Gives a synchronous operation an asynchronous signature.
# Used to pass synchronous functions to callers that expect
#   asynchronous signatures.
_async = (f, args...) ->
  later = (args..., go) ->
    try
      result = f.apply null, args
      go null, result
    catch error
      go error
  _fork later, args

#
# Asynchronous find operation.
#
# find attr, prop, array
# find array, attr, prop
# find attr, obj
# find obj, attr
#

_find$3 = (attr, prop, obj) ->
  if _isFuture obj
    return _async _find$3, attr, prop, obj
  else if isArray obj
    for v in obj
      return v if v[attr] is prop
    return
  return

_find$2 = (attr, obj) ->
  if _isFuture obj
    return _async _find$2, attr, obj
  else if isString attr
    if isArray obj
      return _find$3 'name', attr, obj
    else
      return obj[attr]
  return

_find = (args...) ->
  switch args.length
    when 3
      [ a, b, c ] = args
      ta = typeOf a
      tb = typeOf b
      tc = typeOf c
      if ta is 'Array' and tb is 'String'
        return _find$3 b, c, a
      else if ta is 'String' and tc = 'Array'
        return _find$3 a, b, c
    when 2
      [ a, b ] = args
      return unless a
      return unless b
      if isString b
        return _find$2 b, a
      else if isString a
        return _find$2 a, b
  return

# Duplicate of _find$2
_get = (attr, obj) ->
  if _isFuture obj
    return _async _get, attr, obj
  else if isString attr
    if isArray obj
      return _find$3 'name', attr, obj
    else
      return obj[attr]
  return

module.exports =
  createBuffer: createBuffer #XXX rename
  noop: _noop
  applicate: _applicate
  isFuture: _isFuture
  fork: _fork
  join: _join
  pipe: pipe
  iterate: iterate
  async: _async
  find: _find
  get: _get


