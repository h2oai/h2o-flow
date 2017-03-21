/* eslint no-unused-vars: "error"*/

import renderConfusionMatrices from './renderConfusionMatrices';
import toggle from './toggle';
import cloneModel from './cloneModel';
import predict from './predict';
import inspect from './inspect';
import previewPojo from './previewPojo';
import downloadPojo from './downloadPojo';
import downloadMojo from './downloadMojo';
import exportModel from './exportModel';
import deleteModel from './deleteModel';

import renderKMeansPlots from './renderKMeansPlots';
import renderGLMPlots from './renderGLMPlots';
import renderDeepNetPlots from './renderDeepNetPlots';
import renderTreeAlgoPlots from './renderTreeAlgoPlots';
import renderStackedEnsemblePlots from './renderStackedEnsemblePlots';
import renderGainsLiftPlots from './renderGainsLiftPlots';
import renderTables from './renderTables';

export default function createOutput(_, _model) {
  const lodash = window._;
  const Flow = window.Flow;
  _.modelOutputIsExpanded = Flow.Dataflow.signal(false);
  _.plots = Flow.Dataflow.signals([]);
  _.pojoPreview = Flow.Dataflow.signal(null);
  const _isPojoLoaded = Flow.Dataflow.lift(_.pojoPreview, preview => {
    if (preview) {
      return true;
    }
    return false;
  });

  // TODO use _.enumerate()
  const _inputParameters = lodash.map(_model.parameters, parameter => {
    const type = parameter.type;
    const defaultValue = parameter.default_value;
    const actualValue = parameter.actual_value;
    const label = parameter.label;
    const help = parameter.help;
    const value = (() => {
      switch (type) {
        case 'Key<Frame>':
        case 'Key<Model>':
          if (actualValue) {
            return actualValue.name;
          }
          return null;
            // break; // no-unreachable
        case 'VecSpecifier':
          if (actualValue) {
            return actualValue.column_name;
          }
          return null;
            // break; // no-unreachable
        case 'string[]':
        case 'byte[]':
        case 'short[]':
        case 'int[]':
        case 'long[]':
        case 'float[]':
        case 'double[]':
          if (actualValue) {
            return actualValue.join(', ');
          }
          return null;
            // break; // no-unreachable
        default:
          return actualValue;
      }
    })();
    return {
      label,
      value,
      help,
      isModified: defaultValue === actualValue,
    };
  });

  // look at the algo of the current model
  // and render the relevant plots and tables
  switch (_model.algo) {
    case 'kmeans':
      renderKMeansPlots(_);
      break;
    case 'glm':
      renderGLMPlots(_);
      renderConfusionMatrices(_);
      break;
    case 'deeplearning':
    case 'deepwater':
      renderDeepNetPlots(_);
      renderConfusionMatrices(_);
      break;
    case 'gbm':
    case 'drf':
    case 'svm':
    case 'xgboost':
      renderTreeAlgoPlots(_);
      renderConfusionMatrices(_);
      break;
    case 'stackedensemble':
      renderStackedEnsemblePlots(_);
      renderConfusionMatrices(_);
      break;
    default:
      // do nothing
  }

  renderGainsLiftPlots(_);
  renderTables(_, _model);

  return {
    key: _model.model_id,
    algo: _model.algo_full_name,
    plots: _.plots,
    inputParameters: _inputParameters,
    isExpanded: _.modelOutputIsExpanded,
    toggle: toggle.bind(this, _),
    cloneModel,
    predict: predict.bind(this, _),
    inspect: inspect.bind(this, _),
    previewPojo: previewPojo.bind(this, _),
    downloadPojo: downloadPojo.bind(this, _),
    downloadMojo: downloadMojo.bind(this, _),
    pojoPreview: _.pojoPreview,
    isPojoLoaded: _isPojoLoaded,
    exportModel: exportModel.bind(this, _),
    deleteModel: deleteModel.bind(this, _),
  };
}
