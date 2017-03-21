import { render_ } from './render_';
import { inspect_ } from './inspect_';
import { inspectObject } from './inspectObject';

import { h2oPredictOutput } from '../h2oPredictOutput';

import { flowPreludeFunction } from '../flowPreludeFunction';
const flowPrelude = flowPreludeFunction();

export function extendPrediction(_, result) {
  const lodash = window._;
  let prediction;
  const modelKey = result.model.name;
  const _ref1 = result.frame;
  const frameKey = _ref1 != null ? _ref1.name : void 0;
  prediction = lodash.head(result.model_metrics);
  const predictionFrame = result.predictions_frame;
  const inspections = {};
  if (prediction) {
    inspectObject(inspections, 'Prediction', `getPrediction model: ${flowPrelude.stringify(modelKey)}, frame: ${flowPrelude.stringify(frameKey)}`, prediction);
  } else {
    prediction = {};
    inspectObject(inspections, 'Prediction', `getPrediction model: ${flowPrelude.stringify(modelKey)}, frame: ${flowPrelude.stringify(frameKey)}`, { prediction_frame: predictionFrame });
  }
  inspect_(prediction, inspections);
  return render_(_, prediction, h2oPredictOutput, prediction);
}
