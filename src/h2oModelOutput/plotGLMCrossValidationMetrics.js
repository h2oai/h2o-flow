import getThresholdsAndCriteria from './getThresholdsAndCriteria';
import getAucAsLabel from './getAucAsLabel';
import renderPlot from './renderPlot';

export default function plotGLMCrossValidationMetrics(_, table) {
  const plotTitle = `ROC Curve - Cross Validation Metrics' + ${getAucAsLabel(_, _.model, 'output - cross_validation_metrics')}`;
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
  const thresholdFunction = getThresholdsAndCriteria(
    _,
    table,
    'output - cross_validation_metrics - Maximum Metrics'
  );
  renderPlot(
    _,
    plotTitle,
    false,
    plotFunction,
    thresholdFunction
  );
}
