import plotGLMScoringHistory from './plotGLMScoringHistory';
import plotGLMThresholdsTrainingMetrics from './plotGLMThresholdsTrainingMetrics';
import plotGLMThresholdsValidationMetrics from './plotGLMThresholdsValidationMetrics';
import plotGLMCrossValidationMetrics from './plotGLMCrossValidationMetrics';
import plotGLMStandardizedCoefficientMagnitudes from './plotGLMStandardizedCoefficientMagnitudes';

export default function renderGLMPlots(_) {
  let table;
  table = _.inspect('output - Scoring History', _.model);
  if (typeof table !== 'undefined') {
    plotGLMScoringHistory(_, table);
  }
  table = _.inspect('output - training_metrics - Metrics for Thresholds', _.model);
  if (typeof table !== 'undefined') {
    plotGLMThresholdsTrainingMetrics(_, table);
  }
  table = _.inspect('output - validation_metrics - Metrics for Thresholds', _.model);
  if (typeof table !== 'undefined') {
    plotGLMThresholdsValidationMetrics(_, table);
  }
  table = _.inspect('output - cross_validation_metrics - Metrics for Thresholds', _.model);
  if (typeof table !== 'undefined') {
    plotGLMCrossValidationMetrics(_, table);
  }
  table = _.inspect('output - Standardized Coefficient Magnitudes', _.model);
  if (typeof table !== 'undefined') {
    plotGLMStandardizedCoefficientMagnitudes(_, table);
  }
}
