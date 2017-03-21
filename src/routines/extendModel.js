import { inspectModelParameters } from './inspectModelParameters';
import { inspectObject } from './inspectObject';
import { inspectTwoDimTable_ } from './inspectTwoDimTable_';
import { inspect_ } from './inspect_';
import { render_ } from './render_';

import { h2oModelOutput } from '../h2oModelOutput/h2oModelOutput';
import { getModelRequest } from '../h2oProxy/getModelRequest';

import { flowPreludeFunction } from '../flowPreludeFunction';
const flowPrelude = flowPreludeFunction();

export function extendModel(_, model) {
  const lodash = window._;
  lodash.extend = model => {
    let table;
    let tableName;
    let _i;
    let _len;
    let _ref1;
    const inspections = {};
    inspections.parameters = inspectModelParameters(model);
    const origin = `getModel ${flowPrelude.stringify(model.model_id.name)}`;
    inspectObject(inspections, 'output', origin, model.output);

    // Obviously, an array of 2d tables calls for a megahack.
    if (model.__meta.schema_type === 'NaiveBayesModel') {
      if (lodash.isArray(model.output.pcond)) {
        _ref1 = model.output.pcond;
        for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
          table = _ref1[_i];
          tableName = `output - pcond - ${table.name}`;
          inspections[tableName] = inspectTwoDimTable_(origin, tableName, table);
        }
      }
    }
    inspect_(model, inspections);
    return model;
  };
  const refresh = go => getModelRequest(_, model.model_id.name, (error, model) => {
    if (error) {
      return go(error);
    }
    return go(null, lodash.extend(model));
  });
  lodash.extend(model);
  _.model = model;
  return render_(_, model, h2oModelOutput, model, refresh);
}
