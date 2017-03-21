import plotGainsLiftTrainingMetrics from './plotGainsLiftTrainingMetrics';
import plotGainsLiftValidationMetrics from './plotGainsLiftValidationMetrics';
import plotGainsLiftCrossValidationMetrics from './plotGainsLiftCrossValidationMetrics';

export default function renderGainsLiftPlots(_) {
  let table;
  table = _.inspect('output - training_metrics - Gains/Lift Table', _.model);
  if (typeof table !== 'undefined') {
    plotGainsLiftTrainingMetrics(_, table);
  }
  table = _.inspect('output - validation_metrics - Gains/Lift Table', _.model);
  if (typeof table !== 'undefined') {
    plotGainsLiftValidationMetrics(_, table);
  }
  table = _.inspect('output - cross_validation_metrics - Gains/Lift Table', _.model);
  if (typeof table !== 'undefined') {
    plotGainsLiftCrossValidationMetrics(_, table);
  }
}
