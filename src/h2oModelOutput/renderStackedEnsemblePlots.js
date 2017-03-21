import plotStackedEnsembleThresholdsTrainingMetrics from './plotStackedEnsembleThresholdsTrainingMetrics';
import plotStackedEnsemblesThresholdsValidationMetrics from './plotStackedEnsemblesThresholdsValidationMetrics';
import plotStackedEnsembleThresholdsCrossValidationMetrics from './plotStackedEnsembleThresholdsCrossValidationMetrics';
import plotStackedEnsembleVariableImportances from './plotStackedEnsembleVariableImportances';

export default function renderStackedEnsemblePlots(_) {
  let table;
  table = _.inspect('output - training_metrics - Metrics for Thresholds', _.model);
  if (typeof table !== 'undefined') {
    plotStackedEnsembleThresholdsTrainingMetrics(_, table);
  }
  table = _.inspect('output - validation_metrics - Metrics for Thresholds', _.model);
  if (typeof table !== 'undefined') {
    plotStackedEnsemblesThresholdsValidationMetrics(_, table);
  }
  table = _.inspect('output - cross_validation_metrics - Metrics for Thresholds', _.model);
  if (typeof table !== 'undefined') {
    plotStackedEnsembleThresholdsCrossValidationMetrics(_, table);
  }
  table = _.inspect('output - Variable Importances', _.model);
  if (typeof table !== 'undefined') {
    plotStackedEnsembleVariableImportances(_, table);
  }
}
