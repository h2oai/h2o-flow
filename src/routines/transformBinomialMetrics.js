import { getTwoDimData } from './getTwoDimData';

export function transformBinomialMetrics(metrics) {
  let cms;
  let domain;
  let fns;
  let fps;
  let i;
  let tns;
  let tp;
  let tps;
  const scores = metrics.thresholds_and_metric_scores;
  if (scores) {
    domain = metrics.domain;
    tps = getTwoDimData(scores, 'tps');
    tns = getTwoDimData(scores, 'tns');
    fps = getTwoDimData(scores, 'fps');
    fns = getTwoDimData(scores, 'fns');
    cms = (() => {
      let _i;
      const _results = [];
      _i = 0;
      const _len = tps.length;
      for (i = _i, _len; _i < _len; i = ++_i) {
        tp = tps[i];
        _results.push({
          domain,
          matrix: [
            [
              tns[i],
              fps[i],
            ],
            [
              fns[i],
              tp,
            ],
          ],
        });
      }
      return _results;
    })();
    scores.columns.push({
      name: 'CM',
      description: 'CM',
      format: 'matrix', // TODO HACK
      type: 'matrix',
    });
    scores.data.push(cms);
  }
  return metrics;
}
