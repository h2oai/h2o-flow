import { flowPreludeFunction } from './flowPreludeFunction';
const flowPrelude = flowPreludeFunction();

export function h2oPredictOutput(_, _go, prediction) {
  const lodash = window._;
  const Flow = window.Flow;
  const $ = window.jQuery;
  let frame;
  let model;
  let table;
  let tableName;
  let _i;
  let _len;
  let _ref;
  let _ref1;
  if (prediction) {
    frame = prediction.frame;
    model = prediction.model;
  }
  _.plots = Flow.Dataflow.signals([]);
  const _canInspect = prediction.__meta;
  const renderPlot = (title, prediction, render) => {
    const container = Flow.Dataflow.signal(null);
    const combineWithFrame = () => {
      const predictionsFrameName = prediction.predictions.frame_id.name;
      const targetFrameName = `combined-${predictionsFrameName}`;
      return _.insertAndExecuteCell('cs', `bindFrames ${flowPrelude.stringify(targetFrameName)}, [ ${flowPrelude.stringify(predictionsFrameName)}, ${flowPrelude.stringify(frame.name)} ]`);
    };
    render((error, vis) => {
      if (error) {
        return console.debug(error);
      }
      $('a', vis.element).on('click', e => {
        const $a = $(e.target);
        switch ($a.attr('data-type')) {
          case 'frame':
            return _.insertAndExecuteCell('cs', `getFrameSummary ${flowPrelude.stringify($a.attr('data-key'))}`);
          case 'model':
            return _.insertAndExecuteCell('cs', `getModel ${flowPrelude.stringify($a.attr('data-key'))}`);
          default:
            // do nothing
        }
      });
      return container(vis.element);
    });
    return _.plots.push({
      title,
      plot: container,
      combineWithFrame,
      canCombineWithFrame: title === 'Prediction',
    });
  };
  if (prediction) {
    _ref = prediction.__meta;
    switch (_ref != null ? _ref.schema_type : void 0) {
      case 'ModelMetricsBinomial':
      case 'ModelMetricsBinomialGLM':
        table = _.inspect('Prediction - Metrics for Thresholds', prediction);
        if (table) {
          renderPlot('ROC Curve', prediction, _.plot(g => g(g.path(g.position('fpr', 'tpr')), g.line(g.position(g.value(1), g.value(0)), g.strokeColor(g.value('red'))), g.from(table), g.domainX_HACK(0, 1), g.domainY_HACK(0, 1))));
        }
        break;
      default:
        // do nothing
    }
    _ref1 = _.ls(prediction);
    for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
      tableName = _ref1[_i];
      table = _.inspect(tableName, prediction);
      if (table) {
        if (table.indices.length > 1) {
          renderPlot(tableName, prediction, _.plot(g => g(g.select(), g.from(table))));
        } else {
          renderPlot(tableName, prediction, _.plot(g => g(g.select(0), g.from(table))));
        }
      }
    }
  }
  const inspect = () => { // eslint-disable-line
    // XXX get this from prediction table
    return _.insertAndExecuteCell('cs', `inspect getPrediction model: ${flowPrelude.stringify(model.name)}, frame: ${flowPrelude.stringify(frame.name)}`);
  };
  lodash.defer(_go);
  return {
    plots: _.plots,
    inspect,
    canInspect: _canInspect,
    template: 'flow-predict-output',
  };
}

