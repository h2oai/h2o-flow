#
# Reactive programming / Dataflow programming wrapper over KO
#
{ map, forEach, isFunction, isArray } = require('lodash')

{ copy, never, remove } = require('./prelude')

createSlot = ->
  arrow = null

  self = (args...) ->
    if arrow
      arrow.func.apply null, args
    else
      undefined

  self.subscribe = (func) ->
    console.assert isFunction func
    if arrow
      throw new Error 'Cannot re-attach slot'
    else
      arrow =
        func: func
        dispose: -> arrow = null

  self.dispose = ->
    arrow.dispose() if arrow

  self

createSlots = ->
  arrows = []

  self = (args...) ->
    map arrows, (arrow) -> arrow.func.apply null, args

  self.subscribe = (func) ->
    console.assert isFunction func
    arrows.push arrow =
      func: func
      dispose: -> remove arrows, arrow
    arrow

  self.dispose = ->
    forEach (copy arrows), (arrow) -> arrow.dispose()

  self

if window?
  ko = require('./knockout')
  createObservable = ko.observable
  createObservableArray = ko.observableArray
  isObservable = ko.isObservable
else
  createObservable = (initialValue) ->
    arrows = []
    currentValue = initialValue

    notifySubscribers = (arrows, newValue) ->
      for arrow in arrows
        arrow.func newValue
      return

    self = (newValue) ->
      if arguments.length is 0
        currentValue
      else
        unchanged = if self.equalityComparer
          self.equalityComparer currentValue, newValue
        else
          currentValue is newValue

        unless unchanged
          currentValue = newValue
          notifySubscribers arrows, newValue

    self.subscribe = (func) ->
      console.assert isFunction func
      arrows.push arrow =
        func: func
        dispose: -> remove arrows, arrow
      arrow

    self.__observable__ = yes

    self

  createObservableArray = createObservable

  isObservable = (obj) -> if obj.__observable__ then yes else no

createSignal = (value, equalityComparer) ->
  if arguments.length is 0
    createSignal undefined, never
  else
    observable = createObservable value
    observable.equalityComparer = equalityComparer if isFunction equalityComparer
    observable

_isSignal = isObservable

createSignals = (array) -> createObservableArray array or []

_link = (source, func) ->
  console.assert isFunction source, '[signal] is not a function'
  console.assert isFunction source.subscribe, '[signal] does not have a [dispose] method'
  console.assert isFunction func, '[func] is not a function'

  source.subscribe func

_unlink = (arrows) ->
  if isArray arrows
    for arrow in arrows
      console.assert isFunction arrow.dispose, '[arrow] does not have a [dispose] method'
      arrow.dispose()
  else
    console.assert isFunction arrows.dispose, '[arrow] does not have a [dispose] method'
    arrows.dispose()

#
# Combinators
#

_apply = (sources, func) ->
  func.apply null, map sources, (source) -> source()

_act = (sources..., func) ->
  _apply sources, func
  map sources, (source) ->
    _link source, -> _apply sources, func

_react = (sources..., func) ->
  map sources, (source) ->
    _link source, -> _apply sources, func

_lift = (sources..., func) ->
  evaluate = -> _apply sources, func
  target = createSignal evaluate()
  map sources, (source) ->
    _link source, -> target evaluate()
  target

_merge = (sources..., target, func) ->
  evaluate = -> _apply sources, func
  target evaluate()
  map sources, (source) ->
    _link source, -> target evaluate()

module.exports =
  slot: createSlot
  slots: createSlots
  signal: createSignal
  signals: createSignals
  isSignal: _isSignal
  link: _link
  unlink: _unlink
  act: _act
  react: _react
  lift: _lift
  merge: _merge
