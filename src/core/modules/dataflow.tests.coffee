test = require('tape')
{ isUndefined } = require('lodash')

{ act, react, merge, slot, slots, link, unlink, signal, lift } = require('./dataflow')

test 'dataflow slot should not fail when unlinked', (t) ->
  func = do slot
  result = null
  t.doesNotThrow -> result = func 1, 2, 3
  t.ok isUndefined result
  t.end()

test 'dataflow slot should propagate when linked', (t) ->
  func = do slot
  link func, (a, b, c) -> a + b + c
  t.equal func(1, 2, 3), 6
  t.end()

test 'dataflow slot should raise exception when re-linked', (t) ->
  func = do slot
  link func, (a, b, c) -> a + b + c
  t.equal func(1, 2, 3), 6
  t.throws -> link func, (a, b, c) -> a * b * c
  t.end()

test 'dataflow slot should stop propagating when unlinked', (t) ->
  func = do slot
  target = (a, b, c) -> a + b + c
  arrow = link func, target
  t.equal func(1, 2, 3), 6
  unlink arrow
  result = null
  t.doesNotThrow -> result = func 1, 2, 3
  t.ok isUndefined result
  t.end()

test 'dataflow slot should stop propagating when disposed', (t) ->
  func = do slot
  target = (a, b, c) -> a + b + c
  link func, target
  t.equal func(1, 2, 3), 6
  func.dispose()
  result = null
  t.doesNotThrow -> result = func 1, 2, 3
  t.ok isUndefined result
  t.end()

test 'dataflow slots should not fail when unlinked', (t) ->
  func = do slots
  result = null
  t.doesNotThrow -> result = func 1, 2, 3
  t.deepEqual result, []
  t.end()

test 'dataflow slots should propagate when linked', (t) ->
  func = do slots
  link func, (a, b, c) -> a + b + c
  t.deepEqual func(1, 2, 3), [6]
  t.end()

test 'dataflow slots should allow multicasting', (t) ->
  func = do slots
  addition = (a, b, c) -> a + b + c
  multiplication = (a, b, c) -> a * b * c
  link func, addition
  link func, multiplication
  t.deepEqual func(2, 3, 4), [9, 24]
  t.end()

test 'dataflow slots should stop propagating when unlinked', (t) ->
  func = do slots
  addition = (a, b, c) -> a + b + c
  multiplication = (a, b, c) -> a * b * c
  additionArrow = link func, addition
  multiplicationArrow = link func, multiplication
  t.deepEqual func(2, 3, 4), [9, 24]
  unlink additionArrow
  t.deepEqual func(2, 3, 4), [24]
  unlink multiplicationArrow
  t.deepEqual func(2, 3, 4), []
  t.end()

test 'dataflow slots should stop propagating when disposed', (t) ->
  func = do slots
  addition = (a, b, c) -> a + b + c
  multiplication = (a, b, c) -> a * b * c
  additionArrow = link func, addition
  multiplicationArrow = link func, multiplication
  t.deepEqual func(2, 3, 4), [9, 24]
  func.dispose()
  t.deepEqual func(2, 3, 4), []
  t.end()

test 'dataflow signal should hold value when initialized', (t) ->
  sig = signal 42
  t.equal sig(), 42
  t.end()

test 'dataflow signal should return value when called without arguments', (t) ->
  sig = signal 42
  t.equal sig(), 42
  t.end()

test 'dataflow signal should hold new value when reassigned', (t) ->
  sig = signal 42
  t.equal sig(), 42
  sig 43
  t.equal sig(), 43
  t.end()

test 'dataflow signal should not propagate unless value is changed (without comparator)', (t) ->
  sig = signal 42
  propagated = no
  link sig, (value) -> propagated = yes
  t.equal propagated, no
  sig 42
  t.equal propagated, no
  t.end()

test 'dataflow signal should propagate value when value is changed (without comparator)', (t) ->
  sig = signal 42
  propagated = no
  propagatedValue = 0
  link sig, (value) ->
    propagated = yes
    propagatedValue = value
  t.equal propagated, no
  sig 43
  t.equal propagated, yes
  t.equal propagatedValue, 43
  t.end()

test 'dataflow signal should not propagate unless value is changed (with comparator)', (t) ->
  comparator = (a, b) -> a.answer is b.answer
  sig = signal { answer: 42 }, comparator
  propagated = no
  link sig, (value) -> propagated = yes
  t.equal propagated, no
  sig answer: 42
  t.equal propagated, no
  t.end()

test 'dataflow signal should propagate when value is changed (with comparator)', (t) ->
  comparator = (a, b) -> a.answer is b.answer
  sig = signal { answer: 42 }, comparator
  propagated = no
  propagatedValue = null
  link sig, (value) ->
    propagated = yes
    propagatedValue = value
  t.equal propagated, no

  newValue = answer: 43
  sig newValue
  t.equal propagated, yes
  t.equal propagatedValue, newValue
  t.end()

test 'dataflow signal should allow multicasting', (t) ->
  sig = signal 42
  propagated1 = no
  propagated2 = no
  target1 = (value) -> propagated1 = yes
  target2 = (value) -> propagated2 = yes
  link sig, target1
  link sig, target2
  t.equal propagated1, no
  t.equal propagated2, no

  sig 43
  t.equal propagated1, yes
  t.equal propagated2, yes
  t.end()

test 'dataflow signal should stop propagating when unlinked', (t) ->
  sig = signal 42
  propagated1 = no
  propagated2 = no
  target1 = (value) -> propagated1 = yes
  target2 = (value) -> propagated2 = yes
  arrow1 = link sig, target1
  arrow2 = link sig, target2
  t.equal propagated1, no
  t.equal propagated2, no

  sig 43
  t.equal propagated1, yes
  t.equal propagated2, yes

  propagated1 = no
  propagated2 = no
  unlink arrow2
  sig 44
  t.equal propagated1, yes
  t.equal propagated2, no

  propagated1 = no
  propagated2 = no
  unlink arrow1
  sig 45
  t.equal propagated1, no
  t.equal propagated2, no
  t.end()

test 'dataflow empty signals should always propagate', (t) ->
  event = do signal
  propagated = no
  link event, -> propagated = yes
  t.equal propagated, no
  event yes
  t.equal propagated, yes
  t.end()

test 'dataflow context should unlink multiple arrows at once', (t) ->
  sig = signal 42
  propagated1 = no
  propagated2 = no
  target1 = -> propagated1 = yes
  target2 = -> propagated2 = yes
  arrow1 = link sig, target1
  arrow2 = link sig, target2
  t.equal propagated1, no
  t.equal propagated2, no

  sig 43
  t.equal propagated1, yes
  t.equal propagated2, yes

  propagated1 = no
  propagated2 = no
  unlink [ arrow1, arrow2 ]
  sig 44
  t.equal propagated1, no
  t.equal propagated2, no
  t.end()

test 'dataflow act', (t) ->
  width = signal 2
  height = signal 6
  area = 0
  arrow = act width, height, (w, h) -> area = w * h
  t.equal area, 12

  width 7
  t.equal area, 42

  unlink arrow
  width 2
  t.equal area, 42
  t.end()

test 'dataflow merge', (t) ->
  width = signal 2
  height = signal 6
  area = signal 0
  arrow = merge width, height, area, (w, h) -> w * h
  t.equal area(), 12

  width 7
  t.equal area(), 42

  unlink arrow
  width 2
  t.equal area(), 42
  t.end()

test 'dataflow lift', (t) ->
  width = signal 2
  height = signal 6
  area = lift width, height, (w, h) -> w * h
  t.equal area(), 12

  width 7
  t.equal area(), 42
  t.end()


