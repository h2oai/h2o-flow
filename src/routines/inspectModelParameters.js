import { getModelParameterValue } from './getModelParameterValue';

import { flowPreludeFunction } from '../flowPreludeFunction';
const flowPrelude = flowPreludeFunction();

export function inspectModelParameters(model) {
  return function () {
    const lodash = window._;

    const lightning = (typeof window !== 'undefined' && window !== null ? window.plot : void 0) != null ? window.plot : {};
    if (lightning.settings) {
      lightning.settings.axisLabelFont = '11px "Source Code Pro", monospace';
      lightning.settings.axisTitleFont = 'bold 11px "Source Code Pro", monospace';
    }
    const createList = lightning.createList;
    const createDataframe = lightning.createFrame;

    let attr;
    let data;
    let i;
    let parameter;
    const parameters = model.parameters;
    const attrs = [
      'label',
      'type',
      'level',
      'actual_value',
      'default_value',
    ];
    const vectors = (() => {
      let _i;
      let _j;
      let _len;
      let _len1;
      const _results = [];
      for (_i = 0, _len = attrs.length; _i < _len; _i++) {
        attr = attrs[_i];
        data = new Array(parameters.length);
        for (i = _j = 0, _len1 = parameters.length; _j < _len1; i = ++_j) {
          parameter = parameters[i];
          data[i] = attr === 'actual_value' ? getModelParameterValue(parameter.type, parameter[attr]) : parameter[attr];
        }
        _results.push(createList(attr, data));
      }
      return _results;
    })();
    return createDataframe('parameters', vectors, lodash.range(parameters.length), null, {
      description: `Parameters for model \'${model.model_id.name}\'`, // TODO frame model_id
      origin: `getModel ${flowPrelude.stringify(model.model_id.name)}`,
    });
  };
}
