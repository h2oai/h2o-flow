import { getModelParameterValue } from './getModelParameterValue';

import { flowPreludeFunction } from '../flowPreludeFunction';
const flowPrelude = flowPreludeFunction();

export function inspectParametersAcrossModels(models) {
  return function () {
    const lodash = window._;

    const lightning = (typeof window !== 'undefined' && window !== null ? window.plot : void 0) != null ? window.plot : {};
    if (lightning.settings) {
      lightning.settings.axisLabelFont = '11px "Source Code Pro", monospace';
      lightning.settings.axisTitleFont = 'bold 11px "Source Code Pro", monospace';
    }
    const createVector = lightning.createVector;
    const createFactor = lightning.createFactor;
    const createList = lightning.createList;
    const createDataframe = lightning.createFrame;

    let data;
    let i;
    let model;
    let parameter;
    const leader = lodash.head(models);
    const vectors = (() => {
      let _i;
      let _len;
      const _ref1 = leader.parameters || [];
      const _results = [];
      for (i = _i = 0, _len = _ref1.length; _i < _len; i = ++_i) {
        parameter = _ref1[i];
        data = (() => {
          let _j;
          let _len1;
          const _results1 = [];
          for (_j = 0, _len1 = models.length; _j < _len1; _j++) {
            model = models[_j];
            _results1.push(getModelParameterValue(parameter.type, model.parameters[i].actual_value));
          }
          return _results1;
        })();
        switch (parameter.type) {
          case 'enum':
          case 'Frame':
          case 'string':
            _results.push(createFactor(parameter.label, 'String', data));
            break;
          case 'byte':
          case 'short':
          case 'int':
          case 'long':
          case 'float':
          case 'double':
            _results.push(createVector(parameter.label, 'Number', data));
            break;
          case 'string[]':
          case 'byte[]':
          case 'short[]':
          case 'int[]':
          case 'long[]':
          case 'float[]':
          case 'double[]':
            _results.push(createList(parameter.label, data, a => {
              if (a) {
                return a;
              }
              return void 0;
            }));
            break;
          case 'boolean':
            _results.push(createList(parameter.label, data, a => {
              if (a) {
                return 'true';
              }
              return 'false';
            }));
            break;
          default:
            _results.push(createList(parameter.label, data));
        }
      }
      return _results;
    })();
    const modelKeys = (() => {
      let _i;
      let _len;
      const _results = [];
      for (_i = 0, _len = models.length; _i < _len; _i++) {
        model = models[_i];
        _results.push(model.model_id.name);
      }
      return _results;
    })();
    return createDataframe('parameters', vectors, lodash.range(models.length), null, {
      description: `Parameters for models ${modelKeys.join(', ')}`,
      origin: `getModels ${flowPrelude.stringify(modelKeys)}`,
    });
  };
}
