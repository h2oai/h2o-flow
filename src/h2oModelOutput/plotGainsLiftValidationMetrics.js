import renderPlot from './renderPlot';

export default function plotGainsLiftValidationMetrics(_, table) {
  const plotTitle = 'Validation Metrics - Gains/Lift Table';
  const gFunction = g => g(
    g.path(
      g.position('cumulative_data_fraction', 'cumulative_capture_rate'),
      g.strokeColor(
        g.value('black')
      )
    ),
    g.path(
      g.position('cumulative_data_fraction', 'cumulative_lift'),
      g.strokeColor(
        g.value('green')
      )
    ),
    g.from(table)
  );
  const plotFunction = _.plot(gFunction);
  renderPlot(
    _,
    plotTitle,
    false,
    plotFunction
  );
}
