import { inspect_ } from './inspect_';
import { render_ } from './render_';
import { inspectTwoDimTable_ } from './inspectTwoDimTable_';

import { h2oPartialDependenceOutput } from '../h2oPartialDependenceOutput';

import { flowPreludeFunction } from '../flowPreludeFunction';
const flowPrelude = flowPreludeFunction();

export function extendPartialDependence(_, result) {
  let data;
  let i;
  let origin;
  let _i;
  const inspections = {};
  const _ref1 = result.partial_dependence_data;
  _i = 0;
  const _len = _ref1.length;
  for (i = _i, _len; _i < _len; i = ++_i) {
    data = _ref1[i];
    origin = `getPartialDependence ${flowPrelude.stringify(result.destination_key)}`;
    inspections[`plot${(i + 1)}`] = inspectTwoDimTable_(origin, `plot${(i + 1)}`, data);
  }
  inspect_(result, inspections);
  render_(_, result, h2oPartialDependenceOutput, result);
  return result;
}
