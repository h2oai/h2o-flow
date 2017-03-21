import { flowPreludeFunction } from './flowPreludeFunction';
const flowPrelude = flowPreludeFunction();

export function h2oGridsOutput(_, _go, _grids) {
  const lodash = window._;
  const Flow = window.Flow;
  const _gridViews = Flow.Dataflow.signal([]);
  const createGridView = grid => {
    const view = () => _.insertAndExecuteCell('cs', `getGrid ${flowPrelude.stringify(grid.grid_id.name)}`);
    return {
      key: grid.grid_id.name,
      size: grid.model_ids.length,
      view,
    };
  };
  const buildModel = () => _.insertAndExecuteCell('cs', 'buildModel');
  const initialize = grids => {
    _gridViews(lodash.map(grids, createGridView));
    return lodash.defer(_go);
  };
  initialize(_grids);
  return {
    gridViews: _gridViews,
    hasGrids: _grids.length > 0,
    buildModel,
    template: 'flow-grids-output',
  };
}

