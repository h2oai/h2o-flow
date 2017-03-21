import { getModelsRequest } from './h2oProxy/getModelsRequest';

import { flowPreludeFunction } from './flowPreludeFunction';
const flowPrelude = flowPreludeFunction();

export function h2oExportModelInput(_, _go, modelKey, path, opt) {
  const lodash = window._;
  const Flow = window.Flow;
  if (opt == null) {
    opt = {};
  }
  const _models = Flow.Dataflow.signal([]);
  const _selectedModelKey = Flow.Dataflow.signal(null);
  const _path = Flow.Dataflow.signal(null);
  const _overwrite = Flow.Dataflow.signal(opt.overwrite);
  const _canExportModel = Flow.Dataflow.lift(_selectedModelKey, _path, (modelKey, path) => modelKey && path);
  const exportModel = () => _.insertAndExecuteCell('cs', `exportModel ${flowPrelude.stringify(_selectedModelKey())}, ${flowPrelude.stringify(_path())}, overwrite: ${(_overwrite() ? 'true' : 'false')}`);
  getModelsRequest(_, (error, models) => {
    let model;
    if (error) {
      // empty
      // TODO handle properly
    } else {
      _models((() => {
        let _i;
        let _len;
        const _results = [];
        for (_i = 0, _len = models.length; _i < _len; _i++) {
          model = models[_i];
          _results.push(model.model_id.name);
        }
        return _results;
      })());
      return _selectedModelKey(modelKey);
    }
  });
  lodash.defer(_go);
  return {
    models: _models,
    selectedModelKey: _selectedModelKey,
    path: _path,
    overwrite: _overwrite,
    canExportModel: _canExportModel,
    exportModel,
    template: 'flow-export-model-input',
  };
}

