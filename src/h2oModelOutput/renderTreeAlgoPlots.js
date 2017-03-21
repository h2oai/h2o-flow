import plotTreeAlgoScoringHistory from './plotTreeAlgoScoringHistory';
import plotTreeAlgoThresholdsTrainingMetrics from './plotTreeAlgoThresholdsTrainingMetrics';
import plotTreeAlgoThresholdsValidationMetrics from './plotTreeAlgoThresholdsValidationMetrics';
import plotTreeAlgoThresholdsCrossValidationMetrics from './plotTreeAlgoThresholdsCrossValidationMetrics';
import plotTreeAlgoVariableImportances from './plotTreeAlgoVariableImportances';

export default function renderTreeAlgoPlots(_) {
  let table;
  table = _.inspect('output - Scoring History', _.model);
  if (typeof table !== 'undefined') {
    plotTreeAlgoScoringHistory(_, table);
  }
  table = _.inspect('output - training_metrics - Metrics for Thresholds', _.model);
  if (typeof table !== 'undefined') {
    plotTreeAlgoThresholdsTrainingMetrics(_, table);
  }
  table = _.inspect('output - validation_metrics - Metrics for Thresholds', _.model);
  if (typeof table !== 'undefined') {
    plotTreeAlgoThresholdsValidationMetrics(_, table);
  }
  table = _.inspect('output - cross_validation_metrics - Metrics for Thresholds', _.model);
  if (typeof table !== 'undefined') {
    plotTreeAlgoThresholdsCrossValidationMetrics(_, table);
  }
  table = _.inspect('output - Variable Importances', _.model);
  if (typeof table !== 'undefined') {
    plotTreeAlgoVariableImportances(_, table);
  }
}
