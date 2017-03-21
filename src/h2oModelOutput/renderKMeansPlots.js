import plotKMeansScoringHistory from './plotKMeansScoringHistory';

export default function renderKMeansPlots(_) {
  const table = _.inspect('output - Scoring History', _.model);
  if (typeof table !== 'undefined') {
    plotKMeansScoringHistory(_, table);
  }
}
