import { inspectParametersAcrossModels } from './inspectParametersAcrossModels';
import { render_ } from './render_';
import { inspect_ } from './inspect_';

import { h2oModelsOutput } from '../h2oModelsOutput';

export function extendModels(_, models) {
  const lodash = window._;
  let model;
  const inspections = {};
  const algos = lodash.unique((() => {
    let _i;
    let _len;
    const _results = [];
    for (_i = 0, _len = models.length; _i < _len; _i++) {
      model = models[_i];
      _results.push(model.algo);
    }
    return _results;
  })());
  if (algos.length === 1) {
    inspections.parameters = inspectParametersAcrossModels(models);
  }

  // modelCategories = unique (model.output.model_category for model in models)
  //
  // TODO implement model comparision after 2d table cleanup for model metrics
  //
  // if modelCategories.length is 1
  //  inspections.outputs = inspectOutputsAcrossModels (head modelCategories), models

  inspect_(models, inspections);
  return render_(_, models, h2oModelsOutput, models);
}
