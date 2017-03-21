import getThresholdsAndCriteria from './getThresholdsAndCriteria';
import getAucAsLabel from './getAucAsLabel';
import renderPlot from './renderPlot';

export default function plotGLMThresholdsMetrics(_, table) {
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
    'output - validation_metrics - Maximum Metrics'
  );
  const plotTitle = `ROC Curve - Validation Metrics${getAucAsLabel(_, _.model, 'output - validation_metrics')}`;
  renderPlot(
    _,
    plotTitle,
    false,
    plotFunction,
    thresholdFunction
  );
}
