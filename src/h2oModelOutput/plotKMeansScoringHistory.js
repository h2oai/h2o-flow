import renderPlot from './renderPlot';

export default function plotKMeansScoringHistory(_, table) {
  const gFunction = g => g(
      g.path(
        g.position('iteration', 'within_cluster_sum_of_squares'),
        g.strokeColor(
          g.value('#1f77b4')
        )
      ),
      g.point(
        g.position('iteration', 'within_cluster_sum_of_squares'),
        g.strokeColor(
          g.value('#1f77b4')
        )
      ),
      g.from(table)
    );
  const plotFunction = _.plot(gFunction);
  renderPlot(
    _,
    'Scoring History',
    false,
    plotFunction
  );
}
