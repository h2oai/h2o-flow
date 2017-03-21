import { flowPreludeFunction } from './flowPreludeFunction';
const flowPrelude = flowPreludeFunction();

export function h2oPlotInput(_, _go, _frame) {
  console.log('arguments passed into h2oPlotInput', arguments);
  const Flow = window.Flow;
  const lodash = window._;
  let vector;
  const _types = [
    'point',
    'path',
    'rect',
  ];
  const _vectors = (() => {
    let _i;
    let _len;
    const _ref = _frame.vectors;
    const _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      vector = _ref[_i];
      if (vector.type === 'String' || vector.type === 'Number') {
        _results.push(vector.label);
      }
    }
    return _results;
  })();
  const _type = Flow.Dataflow.signal(null);
  const _x = Flow.Dataflow.signal(null);
  const _y = Flow.Dataflow.signal(null);
  _.color = Flow.Dataflow.signal(null);
  const _canPlot = Flow.Dataflow.lift(_type, _x, _y, (type, x, y) => type && x && y);
  const plot = () => {
    const color = _.color();
    // refactor this ternary statement
    // const command = color ? `plot (g) -> g(\n  g.${_type()}(\n    g.position ${flowPrelude.stringify(_x())}, ${flowPrelude.stringify(_y())}\n    g.color ${flowPrelude.stringify(color)}\n  )\n  g.from inspect ${flowPrelude.stringify(_frame.label)}, ${_frame.metadata.origin}\n)` : `plot (g) -> g(\n  g.${_type()}(\n    g.position ${flowPrelude.stringify(_x())}, ${flowPrelude.stringify(_y())}\n  )\n  g.from inspect ${flowPrelude.stringify(_frame.label)}, ${_frame.metadata.origin}\n)`;

    let command;
    if (color) {
      // CoffeeScript skinny arrow since this command will be passed into a
      // CoffeeScript code cell in Flow
      command = `plot (g) -> g(\n  g.${_type()}(\n    g.position ${flowPrelude.stringify(_x())}, ${flowPrelude.stringify(_y())}\n    g.color ${flowPrelude.stringify(color)}\n  )\n  g.from inspect ${flowPrelude.stringify(_frame.label)}, ${_frame.metadata.origin}\n)`;
    } else {
      // CoffeeScript skinny arrow since this command will be passed into a
      // CoffeeScript code cell in Flow
      command = `plot (g) -> g(\n  g.${_type()}(\n    g.position ${flowPrelude.stringify(_x())}, ${flowPrelude.stringify(_y())}\n  )\n  g.from inspect ${flowPrelude.stringify(_frame.label)}, ${_frame.metadata.origin}\n)`;
    }
    console.log('command from h2oPlotInput', command);
    return _.insertAndExecuteCell('cs', command);
  };
  lodash.defer(_go);
  return {
    types: _types,
    type: _type,
    vectors: _vectors,
    x: _x,
    y: _y,
    color: _.color,
    plot,
    canPlot: _canPlot,
    template: 'flow-plot-input',
  };
}

