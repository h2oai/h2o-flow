import renderMultinomialConfusionMatrix from './renderMultinomialConfusionMatrix';

export default function renderConfusionMatrices(_) {
  console.log('_ from renderConfusionMatrices', _);
  console.log('_.model from renderConfusionMatrices', _.model);
  console.log('_.model.output from renderConfusionMatrices', _.model.output);
  const output = _.model.output;
  let confusionMatrix;
  if (output.model_category === 'Multinomial') {
          // training metrics
    if (
            output.training_metrics !== null &&
            output.training_metrics.cm !== null &&
            output.training_metrics.cm.table
          ) {
      confusionMatrix = output.training_metrics.cm.table;
      renderMultinomialConfusionMatrix(_, 'Training Metrics - Confusion Matrix', confusionMatrix);
    }
          // validation metrics
    if (
            output.validation_metrics !== null &&
            output.validation_metrics.cm !== null &&
            output.validation_metrics.cm.table
          ) {
      confusionMatrix = output.validation_metrics.cm.table;
      renderMultinomialConfusionMatrix(_, 'Validation Metrics - Confusion Matrix', confusionMatrix);
    }
          // cross validation metrics
    if (
            output.cross_validation_metrics !== null &&
            output.cross_validation_metrics.cm !== null &&
            output.cross_validation_metrics.cm.table
          ) {
      confusionMatrix = output.cross_validation_metrics.cm.table;
      renderMultinomialConfusionMatrix(_, 'Cross Validation Metrics - Confusion Matrix', confusionMatrix);
    }
  }
}
