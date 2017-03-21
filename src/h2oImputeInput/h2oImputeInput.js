import { createOptions } from './createOptions';

export function h2oImputeInput(_, _go, opts) {
  const lodash = window._;
  const Flow = window.Flow;
  const H2O = window.H2O;
  const _allMethods = createOptions([
    'Mean',
    'Median',
    'Mode',
  ]);
  const _allCombineMethods = createOptions([
    'Interpolate',
    'Average',
    'Low',
    'High',
  ]);
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
  const _methods = _allMethods;
  const _method = Flow.Dataflow.signal(_allMethods[0]);
  const _canUseCombineMethod = Flow.Dataflow.lift(_method, method => method.value === 'median');
  const _combineMethods = _allCombineMethods;
  const _combineMethod = Flow.Dataflow.signal(_allCombineMethods[0]);
  const _canGroupByColumns = Flow.Dataflow.lift(_method, method => method.value !== 'median');
  const _groupByColumns = Flow.Dataflow.signals([]);
  const _canImpute = Flow.Dataflow.lift(_frame, _column, (frame, column) => frame && column);
  const impute = () => {
    const combineMethod = _combineMethod();
    let groupByColumns;
    const method = _method();
    const arg = {
      frame: _frame(),
      column: _column(),
      method: method.value,
    };
    if (method.value === 'median') {
      if (combineMethod) {
        arg.combineMethod = combineMethod.value;
      }
    } else {
      groupByColumns = _groupByColumns();
      if (groupByColumns.length) {
        arg.groupByColumns = groupByColumns;
      }
    }
    return _.insertAndExecuteCell('cs', `imputeColumn ${JSON.stringify(arg)}`);
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
    methods: _methods,
    method: _method,
    canUseCombineMethod: _canUseCombineMethod,
    combineMethods: _combineMethods,
    combineMethod: _combineMethod,
    canGroupByColumns: _canGroupByColumns,
    groupByColumns: _groupByColumns,
    canImpute: _canImpute,
    impute,
    template: 'flow-impute-input',
  };
}
