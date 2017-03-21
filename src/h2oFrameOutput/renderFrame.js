import renderPlot from './renderPlot';
import renderGrid from './renderGrid';

export default function renderFrame(_, _chunkSummary, _distributionSummary, frame) {
  const gridPlotFunction = _.plot(
    g => g(
      g.select(),
      g.from(
        _.inspect('columns', frame)
      )
    )
  );
  const chunkSummaryPlotFunction = _.plot(
    g => g(
      g.select(),
      g.from(
        _.inspect('Chunk compression summary', frame)
      )
    )
  );
  const distributionSummaryPlotFunction = _.plot(
    g => g(
      g.select(),
      g.from(
        _.inspect('Frame distribution summary', frame)
      )
    )
  );
  renderGrid(_, gridPlotFunction);
  renderPlot(_chunkSummary, chunkSummaryPlotFunction);
  return renderPlot(_distributionSummary, distributionSummaryPlotFunction);
}
