export function computeSplits(ratios, keys) {
  let i;
  let key;
  let part;
  let ratio;
  let sum;
  let _i;
  let _j;
  let _len;
  let _len1;
  const parts = [];
  sum = 0;
  const _ref1 = keys.slice(0, ratios.length);
  for (i = _i = 0, _len = _ref1.length; _i < _len; i = ++_i) {
    key = _ref1[i];
    sum += ratio = ratios[i];
    parts.push({
      key,
      ratio,
    });
  }
  parts.push({
    key: keys[keys.length - 1],
    ratio: 1 - sum,
  });
  const splits = [];
  sum = 0;
  for (_j = 0, _len1 = parts.length; _j < _len1; _j++) {
    part = parts[_j];
    splits.push({
      min: sum,
      max: sum + part.ratio,
      key: part.key,
    });
    sum += part.ratio;
  }
  return splits;
}
