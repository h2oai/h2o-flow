import { flowPreludeFunction } from './flowPreludeFunction';
const flowPrelude = flowPreludeFunction();

export function h2oImportModelOutput(_, _go, result) {
  const lodash = window._;
  const Flow = window.Flow;
  const viewModel = () => _.insertAndExecuteCell('cs', `getModel ${flowPrelude.stringify(result.models[0].model_id.name)}`);
  lodash.defer(_go);
  return {
    viewModel,
    template: 'flow-import-model-output',
  };
}

