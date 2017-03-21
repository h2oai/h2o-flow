import { doGet } from './doGet';

export function getPredictionsRequest(_, modelKey, frameKey, _go) {
  const go = (error, result) => {
    let prediction;
    if (error) {
      return _go(error);
    }
      //
      // TODO workaround for a filtering bug in the API
      //
    const predictions = (() => {
      let _i;
      let _len;
      const _ref = result.model_metrics;
      const _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        prediction = _ref[_i];
        if (modelKey && prediction.model.name !== modelKey) {
          _results.push(null);
        } else if (frameKey && prediction.frame.name !== frameKey) {
          _results.push(null);
        } else {
          _results.push(prediction);
        }
      }
      return _results;
    })();
    return _go(null, (() => {
      let _i;
      let _len;
      const _results = [];
      for (_i = 0, _len = predictions.length; _i < _len; _i++) {
        prediction = predictions[_i];
        if (prediction) {
          _results.push(prediction);
        }
      }
      return _results;
    })());
  };
  if (modelKey && frameKey) {
    return doGet(_, `/3/ModelMetrics/models/${encodeURIComponent(modelKey)}/frames/'${encodeURIComponent(frameKey)}`, go);
  } else if (modelKey) {
    return doGet(_, `/3/ModelMetrics/models/${encodeURIComponent(modelKey)}`, go);
  } else if (frameKey) {
    return doGet(_, `/3/ModelMetrics/frames/${encodeURIComponent(frameKey)}`, go);
  }
  return doGet(_, '/3/ModelMetrics', go);
}
