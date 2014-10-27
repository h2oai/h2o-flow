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
    apply go, null, [ error ].concat args if isFunction go
  

renderable = (f, args..., render) ->
  ft = _fork f, args
  ft.render = render
  ft


_fork = (f, args) ->
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
          apply f, null,
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

isFuture = (a) -> if a?.isFuture then yes else no

fork = (f, args...) -> _fork f, args

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
    call task.future, null, (error, result) ->
      return if _settled
      if error
        _settled = yes
        go Flow.Exception "Error evaluating future[#{task.resultIndex}]", error
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
  _tasks = slice tasks, 0

  next = (args, go) ->
    task = shift _tasks
    if task
      apply task, null, args.concat (error, results...) ->
        if error
          go error
        else
          next results, go
    else
      apply go, null, [ null ].concat args

  (args..., go) ->
    next args, go

iterate = (tasks) ->
  _tasks = slice tasks, 0
  _results = []
  next = (go) ->
    task = shift _tasks
    if task
      task (error, result) ->
        if error
          _results.push [ error ]
        else
          _results.push [ null, result ]
        next go
    else
      #XXX should errors be included in arg #1?
      go null, _results

  (go) ->
    next go

Flow.Async =
  createBuffer: createBuffer #XXX rename
  noop: _noop
  applicate: _applicate
  renderable: renderable
  isFuture: isFuture
  fork: fork
  join: _join
  pipe: pipe
  iterate: iterate


