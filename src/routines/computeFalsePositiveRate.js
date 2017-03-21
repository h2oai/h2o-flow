export function computeFalsePositiveRate(cm) {
  const _ref = cm[0];
  const tn = _ref[0];
  const fp = _ref[1];
  const _ref1 = cm[1];
  const fn = _ref1[0];
  const tp = _ref1[1];
  return fp / (fp + tn);
}
