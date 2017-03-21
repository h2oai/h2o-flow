export function h2oAutoModelInput(_, _go, opts) {
  const lodash = window._;
  const Flow = window.Flow;
  if (opts == null) {
    opts = {};
  }
  const _frames = Flow.Dataflow.signal([]);
  const _frame = Flow.Dataflow.signal(null);
  const _hasFrame = Flow.Dataflow.lift(_frame, frame => {
    if (frame) {
      return true;
    }
    return false;
  });
  const _columns = Flow.Dataflow.signal([]);
  const _column = Flow.Dataflow.signal(null);
  const _canBuildModel = Flow.Dataflow.lift(_frame, _column, (frame, column) => frame && column);
  const defaultMaxRunTime = 3600;
  const _maxRunTime = Flow.Dataflow.signal(defaultMaxRunTime);
  const buildModel = () => {
    let maxRunTime = defaultMaxRunTime;
    const parsed = parseInt(_maxRunTime(), 10);
    if (!lodash.isNaN(parsed)) {
      maxRunTime = parsed;
    }
    const arg = {
      frame: _frame(),
      column: _column(),
      maxRunTime,
    };
    return _.insertAndExecuteCell('cs', `buildAutoModel ${JSON.stringify(arg)}`);
  };
  _.requestFrames(_, (error, frames) => {
    let frame;
    if (error) {
      // empty
      // TODO handle properly
    } else {
      _frames((() => {
        let _i;
        let _len;
        const _results = [];
        for (_i = 0, _len = frames.length; _i < _len; _i++) {
          frame = frames[_i];
          if (!frame.is_text) {
            _results.push(frame.frame_id.name);
          }
        }
        return _results;
      })());
      if (opts.frame) {
        _frame(opts.frame);
      }
    }
  });
  Flow.Dataflow.react(_frame, frame => {
    if (frame) {
      return _.requestFrameSummaryWithoutData(_, frame, (error, frame) => {
        let column;
        if (error) {
          // empty
          // TODO handle properly
        } else {
          _columns((() => {
            let _i;
            let _len;
            const _ref = frame.columns;
            const _results = [];
            for (_i = 0, _len = _ref.length; _i < _len; _i++) {
              column = _ref[_i];
              _results.push(column.label);
            }
            return _results;
          })());
          if (opts.column) {
            _column(opts.column);
            return delete opts.column; // HACK
          }
        }
      });
    }
    return _columns([]);
  });
  lodash.defer(_go);
  return {
    frames: _frames,
    frame: _frame,
    hasFrame: _hasFrame,
    columns: _columns,
    column: _column,
    maxRunTime: _maxRunTime,
    canBuildModel: _canBuildModel,
    buildModel,
    template: 'flow-automodel-input',
  };
}

