H2O.AutoModelInput = (_, _go, opts={}) ->
  _frames = signal []
  _frame = signal null
  _hasFrame = lift _frame, (frame) -> if frame then yes else no
  _columns = signal []
  _column = signal null
  _canBuildModel = lift _frame, _column, (frame, column) -> frame and column
  defaultMaxRunTime = 3600
  _maxRunTime = signal defaultMaxRunTime

  buildModel = ->
    maxRunTime = defaultMaxRunTime
    unless isNaN parsed = parseInt _maxRunTime(), 10
      maxRunTime = parsed

    arg =
      frame: _frame()
      column: _column()
      maxRunTime: maxRunTime

    _.insertAndExecuteCell 'cs', "buildAutoModel #{JSON.stringify arg}"

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
  maxRunTime: _maxRunTime
  canBuildModel: _canBuildModel
  buildModel: buildModel
  template: 'flow-automodel-input'

