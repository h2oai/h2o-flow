{ defer } = require('lodash')

{ stringify } = require('../../core/modules/prelude')
{ react, lift, link, signal, signals } = require("../../core/modules/dataflow")

createOptions = (options) ->
  for option in options
    caption: option
    value: option.toLowerCase()

_allMethods = createOptions [
   'Mean'
   'Median'
   'Mode'
]
_allCombineMethods = createOptions [
   'Interpolate'
   'Average'
   'Low'
   'High'
]

module.exports = (_, _go, opts={}) ->
  _frames = signal []

  _frame = signal null

  _hasFrame = lift _frame, (frame) -> if frame then yes else no

  _columns = signal []

  _column = signal null

  _methods = _allMethods

  _method = signal _allMethods[0]

  _canUseCombineMethod = lift _method, (method) -> method.value is 'median'

  _combineMethods = _allCombineMethods 

  _combineMethod = signal _allCombineMethods[0]

  _canGroupByColumns = lift _method, (method) -> method.value isnt 'median'

  _groupByColumns = signals []

  _canImpute = lift _frame, _column, (frame, column) -> frame and column

  impute = ->
    method = _method()
    arg =
      frame: _frame()
      column: _column()
      method: method.value

    if method.value is 'median'
      if combineMethod = _combineMethod()
        arg.combineMethod = combineMethod.value
    else
      groupByColumns = _groupByColumns()
      if groupByColumns.length
        arg.groupByColumns = groupByColumns

    _.insertAndExecuteCell 'cs', "imputeColumn #{JSON.stringify arg}"

  _.requestFrames (error, frames) ->
    if error
      #TODO handle properly
    else
      _frames (frame.frame_id.name for frame in frames when not frame.is_text)
      if opts.frame
        _frame opts.frame

      return

  react _frame, (frame) ->
    if frame
      _.requestFrameSummaryWithoutData frame, (error, frame) ->
        if error
          #TODO handle properly
        else
          _columns (column.label for column in frame.columns)
          if opts.column
            _column opts.column
            delete opts.column #HACK
    else
      _columns []
  
  defer _go

  frames: _frames
  frame: _frame
  hasFrame: _hasFrame
  columns: _columns
  column: _column
  methods: _methods
  method: _method
  canUseCombineMethod: _canUseCombineMethod
  combineMethods: _combineMethods
  combineMethod: _combineMethod
  canGroupByColumns: _canGroupByColumns
  groupByColumns: _groupByColumns
  canImpute: _canImpute
  impute: impute
  template: 'flow-impute-input'
