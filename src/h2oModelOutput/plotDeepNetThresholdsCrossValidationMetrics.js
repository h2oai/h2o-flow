import renderPlot from './renderPlot';
import getAucAsLabel from './getAucAsLabel';
import getThresholdsAndCriteria from './getThresholdsAndCriteria';

export default function plotDeepNetThresholdsCrossValidationMetrics(_, table) {
  const plotTitle = `'ROC Curve - Cross Validation Metrics' + ${getAucAsLabel(_, _.model, 'output - cross_validation_metrics')}`;
  const gFunction = g => g(
    g.path(
      g.position('fpr', 'tpr')
    ),
    g.line(
      g.position(
        g.value(1),
        g.value(0)
      ),
      g.strokeColor(
        g.value('red')
      )
    ),
    g.from(table),
    g.domainX_HACK(0, 1),
    g.domainY_HACK(0, 1)
  );
  const plotFunction = _.plot(gFunction);
  // TODO fix this hack
  // Mega-hack alert
  // Last arg thresholdsAndCriteria only applies to
  // ROC charts for binomial models
  const thresholdFunction = getThresholdsAndCriteria(_, table, 'output - cross_validation_metrics - Maximum Metrics');
  renderPlot(
    _,
    plotTitle,
    false,
    plotFunction,
    thresholdFunction
  );
}
