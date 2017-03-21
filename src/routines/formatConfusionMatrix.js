import { format4f } from './format4f';

export function formatConfusionMatrix(cm) {
  const Flow = window.Flow;
  const _ref = cm.matrix;
  const _ref1 = _ref[0];
  const tn = _ref1[0];
  const fp = _ref1[1];
  const _ref2 = _ref[1];
  const fn = _ref2[0];
  const tp = _ref2[1];
  const fnr = fn / (tp + fn);
  const fpr = fp / (fp + tn);
  const domain = cm.domain;
  const _ref3 = Flow.HTML.template('table.flow-matrix', 'tbody', 'tr', 'td.strong.flow-center', 'td', 'td.bg-yellow');
  const table = _ref3[0];
  const tbody = _ref3[1];
  const tr = _ref3[2];
  const strong = _ref3[3];
  const normal = _ref3[4];
  const yellow = _ref3[5];
  return table([tbody([
    tr([
      strong('Actual/Predicted'),
      strong(domain[0]),
      strong(domain[1]),
      strong('Error'),
      strong('Rate'),
    ]),
    tr([
      strong(domain[0]),
      yellow(tn),
      normal(fp),
      normal(format4f(fpr)),
      normal(`${fp} / ${(fp + tn)}`),
    ]),
    tr([
      strong(domain[1]),
      normal(fn),
      yellow(tp),
      normal(format4f(fnr)),
      normal(`${fn} / ${(tp + fn)}`),
    ]),
    tr([
      strong('Total'),
      strong(tn + fn),
      strong(tp + fp),
      strong(format4f((fn + fp) / (fp + tn + tp + fn))),
      strong(`${fn}${fp} / ${(fp + tn + tp + fn)}`),
    ]),
  ])]);
}
