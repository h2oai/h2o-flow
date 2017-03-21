import { flowPreludeFunction } from './flowPreludeFunction';
const flowPrelude = flowPreludeFunction();

export function h2oPredictsOutput(_, _go, opts, _predictions) {
  const lodash = window._;
  const Flow = window.Flow;
  let _isCheckingAll;
  const _predictionViews = Flow.Dataflow.signal([]);
  const _checkAllPredictions = Flow.Dataflow.signal(false);
  const _canComparePredictions = Flow.Dataflow.signal(false);
  const _rocCurve = Flow.Dataflow.signal(null);
  const arePredictionsComparable = views => {
    if (views.length === 0) {
      return false;
    }
    return lodash.every(views, view => view.modelCategory === 'Binomial');
  };
  _isCheckingAll = false;
  Flow.Dataflow.react(_checkAllPredictions, checkAll => {
    let view;
    let _i;
    let _len;
    _isCheckingAll = true;
    const _ref = _predictionViews();
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      view = _ref[_i];
      view.isChecked(checkAll);
    }
    _canComparePredictions(checkAll && arePredictionsComparable(_predictionViews()));
    _isCheckingAll = false;
  });
  const createPredictionView = prediction => {
    const _ref = prediction.frame;
    const _modelKey = prediction.model.name;
    const _frameKey = _ref != null ? _ref.name : void 0;
    const _hasFrame = _frameKey;
    const _isChecked = Flow.Dataflow.signal(false);
    Flow.Dataflow.react(_isChecked, () => {
      let view;
      if (_isCheckingAll) {
        return;
      }
      const checkedViews = (() => {
        let _i;
        let _len;
        const _ref1 = _predictionViews();
        const _results = [];
        for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
          view = _ref1[_i];
          if (view.isChecked()) {
            _results.push(view);
          }
        }
        return _results;
      })();
      return _canComparePredictions(arePredictionsComparable(checkedViews));
    });
    const view = () => {
      if (_hasFrame) {
        return _.insertAndExecuteCell('cs', `getPrediction model: ${flowPrelude.stringify(_modelKey)}, frame: ${flowPrelude.stringify(_frameKey)}`);
      }
    };
    const inspect = () => {
      if (_hasFrame) {
        return _.insertAndExecuteCell('cs', `inspect getPrediction model: ${flowPrelude.stringify(_modelKey)}, frame: ${flowPrelude.stringify(_frameKey)}`);
      }
    };
    return {
      modelKey: _modelKey,
      frameKey: _frameKey,
      modelCategory: prediction.model_category,
      isChecked: _isChecked,
      hasFrame: _hasFrame,
      view,
      inspect,
    };
  };
  const _predictionsTable = _.inspect('predictions', _predictions);
  const _metricsTable = _.inspect('metrics', _predictions);
  const _scoresTable = _.inspect('scores', _predictions);
  const comparePredictions = () => {
    let view;
    const selectedKeys = (() => {
      let _i;
      let _len;
      const _ref = _predictionViews();
      const _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        view = _ref[_i];
        if (view.isChecked()) {
          _results.push({
            model: view.modelKey,
            frame: view.frameKey,
          });
        }
      }
      return _results;
    })();
    return _.insertAndExecuteCell('cs', `getPredictions ${flowPrelude.stringify(selectedKeys)}`);
  };
  const plotPredictions = () => _.insertAndExecuteCell('cs', _predictionsTable.metadata.plot);
  const plotScores = () => _.insertAndExecuteCell('cs', _scoresTable.metadata.plot);
  const plotMetrics = () => _.insertAndExecuteCell('cs', _metricsTable.metadata.plot);
  const inspectAll = () => _.insertAndExecuteCell('cs', `inspect ${_predictionsTable.metadata.origin}`);
  const predict = () => _.insertAndExecuteCell('cs', 'predict');
  const initialize = predictions => {
    _predictionViews(lodash.map(predictions, createPredictionView));

    // TODO handle non-binomial models
    // warning: sample code is CoffeeScript
    // rocCurveConfig =
    //   data: _.inspect 'scores', _predictions
    //   type: 'line'
    //   x: 'FPR'
    //   y: 'TPR'
    //   color: 'key'
    // _.plot rocCurveConfig, (error, el) ->
    //   unless error
    //     _rocCurve el

    return lodash.defer(_go);
  };
  initialize(_predictions);
  return {
    predictionViews: _predictionViews,
    hasPredictions: _predictions.length > 0,
    comparePredictions,
    canComparePredictions: _canComparePredictions,
    checkAllPredictions: _checkAllPredictions,
    plotPredictions,
    plotScores,
    plotMetrics,
    inspect: inspectAll,
    predict,
    rocCurve: _rocCurve,
    template: 'flow-predicts-output',
  };
}

