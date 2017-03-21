import plotDeepNetScoringHistory from './plotDeepNetScoringHistory';
import plotDeepNetThresholdsTrainingMetrics from './plotDeepNetThresholdsTrainingMetrics';
import plotDeepNetThresholdsValidationMetrics from './plotDeepNetThresholdsValidationMetrics';
import plotDeepNetThresholdsCrossValidationMetrics from './plotDeepNetThresholdsCrossValidationMetrics';
import plotDeepNetVariableImportances from './plotDeepNetVariableImportances';

export default function renderDeepNetPlots(_) {
  let table;
  table = _.inspect('output - Scoring History', _.model);
  if (typeof table !== 'undefined') {
    plotDeepNetScoringHistory(_, table);
  }
  table = _.inspect('output - training_metrics - Metrics for Thresholds', _.model);
  if (typeof table !== 'undefined') {
    plotDeepNetThresholdsTrainingMetrics(_, table);
  }
  table = _.inspect('output - validation_metrics - Metrics for Thresholds', _.model);
  if (typeof table !== 'undefined') {
    plotDeepNetThresholdsValidationMetrics(_, table);
  }
  table = _.inspect('output - cross_validation_metrics - Metrics for Thresholds', _.model);
  if (typeof table !== 'undefined') {
    plotDeepNetThresholdsCrossValidationMetrics(_, table);
  }
  table = _.inspect('output - Variable Importances', _.model);
  if (typeof table !== 'undefined') {
    plotDeepNetVariableImportances(_, table);
  }
}
