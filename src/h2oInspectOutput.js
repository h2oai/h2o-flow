import { flowPreludeFunction } from './flowPreludeFunction';
const flowPrelude = flowPreludeFunction();

export function h2oInspectOutput(_, _go, _frame) {
  const lodash = window._;
  const Flow = window.Flow;
  const view = () => _.insertAndExecuteCell('cs', `grid inspect ${flowPrelude.stringify(_frame.label)}, ${_frame.metadata.origin}`);
  const plot = () => _.insertAndExecuteCell('cs', _frame.metadata.plot);
  lodash.defer(_go);
  return {
    label: _frame.label,
    vectors: _frame.vectors,
    view,
    canPlot: _frame.metadata.plot,
    plot,
    template: 'flow-inspect-output',
  };
}
